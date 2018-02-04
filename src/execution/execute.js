/**
 * Custom graphql execution: This execution is performed from the first
 * field of the root type resolver and returns selections from the resolved
 * data in each of the other fields and subfields. This allows custom 
 * middleware to be run at different points in the execution lifecycle
 * using directives. It also allows deep tracing data visibility.
 */
import { SchemaDefinition } from '../definition';
import { getArgumentValues } from 'graphql/execution/values';
import { getOperationRootType } from 'graphql/execution/execute';
import { EventType } from '../definition/const';
import {
  promiseReduce,
  promiseMap,
  lodash as _,
  forEach,
  reduce,
  getTime
} from '../jsutils';
import {
  GraphQLSkipResolveInstruction,
  GraphQLOmitTraceInstruction
} from '../types';
import {
  Kind,
  getNamedType,
  getNullableType,
  GraphQLList,
  DirectiveLocation,
  defaultFieldResolver,
  getDirectiveValues,
  GraphQLSkipDirective,
  GraphQLIncludeDirective,
  isAbstractType,
  isSpecifiedScalarType,
  GraphQLEnumType
} from 'graphql';
import {
  getDirectiveResolvers,
  buildDirectiveInfo,
  buildAttachInfo,
  objectTypeLocation
} from './directives';
import {
  getSelection,
  isFirstSelection,
  isRootResolver,
  fieldPath,
  getOperationLocation,
  getFragmentLocation,
  getFragment,
  doesFragmentConditionMatch
} from '../utilities';

export const ExecutionType = {
  RESOLVE: 'RESOLVE',
  DIRECTIVE: 'DIRECTIVE'
};

// create a wrapped default field resolver and add
// a property to identify that it is default
function defaultResolver(...args) {
  return defaultFieldResolver(...args);
}
defaultResolver.__defaultResolver = true;

/**
 * Safe emitter
 * @param {*} info 
 * @param {*} event 
 * @param {*} data 
 */
function emit(info, event, data) {
  const definition = _.get(info, 'schema.definition');
  if (
    definition instanceof SchemaDefinition &&
    _.isFunction(definition.emit)
  ) {
    definition.emit(event, data);
  }
}

/**
 * Ported from graphql-js/execution/execute.js
 * @param {*} info 
 * @param {*} node 
 */
export function shouldIncludeNode(info, node) {
  const skip = getDirectiveValues(
    GraphQLSkipDirective,
    node,
    info.variableValues,
  );
  if (skip && skip.if === true) {
    return false;
  }

  const include = getDirectiveValues(
    GraphQLIncludeDirective,
    node,
    info.variableValues,
  );
  if (include && include.if === false) {
    return false;
  }
  return true;
}

/**
 * Ported from graphql-js/execution/execute.js
 * @param {*} value 
 */
export function getPromise(value) {
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof value.then === 'function'
  ) {
    return value;
  }
}

/**
 * Ported from graphql-js/execution/execute.js
 * @param {*} value 
 * @param {*} context 
 * @param {*} info 
 * @param {*} abstractType 
 */
export function defaultResolveTypeFn(
  value,
  context,
  info,
  abstractType,
) {
  // First, look for `__typename`.
  if (
    value !== null &&
    typeof value === 'object' &&
    typeof value.__typename === 'string'
  ) {
    return value.__typename;
  }

  // Otherwise, test each possible type.
  const possibleTypes = info.schema.getPossibleTypes(abstractType);
  const promisedIsTypeOfResults = [];

  for (let i = 0; i < possibleTypes.length; i++) {
    const type = possibleTypes[i];

    if (type.isTypeOf) {
      const isTypeOfResult = type.isTypeOf(value, context, info);

      const promise = getPromise(isTypeOfResult);
      if (promise) {
        promisedIsTypeOfResults[i] = promise;
      } else if (isTypeOfResult) {
        return type;
      }
    }
  }

  if (promisedIsTypeOfResults.length) {
    return Promise.all(promisedIsTypeOfResults).then(isTypeOfResults => {
      for (let i = 0; i < isTypeOfResults.length; i++) {
        if (isTypeOfResults[i]) {
          return possibleTypes[i];
        }
      }
    });
  }
}

/**
 * Builds a new field resolve args object by
 * cloning current values so that if they are
 * modified by the resolve functions they do not
 * impact any other resolvers with the exception
 * of the fieldNodes which point directly back to
 * the operation ast
 * @param {*} source 
 * @param {*} context 
 * @param {*} info 
 * @param {*} path 
 * @param {*} field 
 * @param {*} selection 
 */
export function buildFieldResolveArgs(
  source,
  context,
  info,
  path,
  field,
  selection,
  args,
  parentType
) {
  return [
    _.cloneDeep(source),
    _.cloneDeep(args),
    context,
    Object.assign(
      Object.create(null),
      info,
      {
        parentType,
        fieldName: selection.name.value,
        fieldNodes: [ selection ],
        returnType: field.type,
        path: _.cloneDeep(path)
      }
    )
  ];
}

/**
 * Completes an execution detail and adds it to the run stack
 * @param {*} stack 
 * @param {*} execution 
 * @param {*} result 
 */
export function calculateRun(stack, execution, result, isDefault) {
  execution.end = getTime();
  execution.duration = execution.end - execution.start;
  if (result instanceof Error) {
    const errKeys = Object.getOwnPropertyNames(result);
    execution.error = _.reduce(errKeys, (errObj, errKey) => {
      return _.set(errObj, [ errKey ], result[errKey]);
    }, {});
  }
  // do not trace default resolvers
  if (!isDefault) {
    stack.push(execution);
  }
}

/**
 * Creates and updates an object that contains run time details for
 * a specific resolver. Also catches any errors
 * @param {*} type 
 * @param {*} name 
 * @param {*} stack 
 * @param {*} resolve 
 */
export function instrumentResolver(
  type,
  name,
  resolverName,
  stack,
  info,
  resolver,
  args,
  resolveErrors
) {

  const parentType = _.get(info, 'attachInfo.fieldInfo.parentType') ||
    info.parentType;
  const fieldName = _.get(info, 'attachInfo.fieldInfo.fieldName') ||
    info.fieldName;
  const returnType = _.get(info, 'attachInfo.fieldInfo.returnType') ||
    info.returnType;

  const execution = {
    type,
    name,
    path: fieldPath(info.attachInfo || info, true),
    location: info.location || null,
    parentType: String(parentType),
    fieldName,
    returnType: String(returnType),
    resolverName,
    start: getTime(),
    end: -1,
    duration: -1,
    error: null
  };

  const isDefault = resolver.__defaultResolver;

  try {
    return Promise.resolve(resolver(...args))
      .then(result => {
        // check for a trace omit instruction
        if (result instanceof GraphQLOmitTraceInstruction) {
          return result.source;
        }
        calculateRun(stack, execution, result, isDefault);
        return result;
      }, err => {
        calculateRun(stack, execution, err, isDefault);
        return resolveErrors ?
          Promise.resolve(err) :
          Promise.reject(err);
      });
  } catch (err) {
    emit(info, EventType.ERROR, err);
    calculateRun(stack, execution, err, isDefault);
    return resolveErrors ?
      Promise.resolve(err) :
      Promise.reject(err);
  }
}

/**
 * Resolves a subfield by building an execution context
 * and then passing that to resolveField along with the
 * current result object
 * @param {*} field 
 * @param {*} result 
 * @param {*} parentType 
 * @param {*} rargs 
 */
export function resolveSubField(field, result, parentType, rargs, isRoot) {
  // check that result is an object, if it is not then subfields
  // cannot be set on it so return a Promise that resolves to null
  if (typeof result !== 'object' || result === null) {
    return Promise.resolve(null);
  }
  const [ source, args, context, info ] = rargs;
  const path = isRoot ?
    { prev: undefined, key: field.name } :
    { prev: _.cloneDeep(info.path), key: field.name };

  const execContext = [
    _.cloneDeep(source),
    _.cloneDeep(args),
    context,
    Object.assign(
      Object.create(null),
      info,
      { path, parentType }
    )
  ];

  return resolveField(result, path, parentType, field.selection, execContext)
    .then(subResult => {
      result[field.name] = subResult;
      return result;
    })
    .catch(error => {
      result[field.name] = error;
      return Promise.resolve(result);
    });
}

/**
 * Resolves subfields either serially if a root
 * mutation field or in parallel if not
 * @param {*} fields 
 * @param {*} result 
 * @param {*} parentType 
 * @param {*} rargs
 * @param {*} serial 
 */
export function resolveSubFields(
  fields,
  result,
  parentType,
  rargs,
  serial
) {
  // if the result is an error resolve it instead of the subfields
  if (result instanceof Error) {
    return Promise.resolve(result);
  }
  const isRoot = typeof serial === 'boolean';

  // resolve tge fields
  return serial ?
    promiseReduce(fields, (res, field) => {
      return resolveSubField(field, result, parentType, rargs, isRoot);
    }) :
    promiseMap(fields, field => {
      return resolveSubField(field, result, parentType, rargs, isRoot);
    });
}

/**
 * Recuresively collects and resolves input object
 * directive resolvers
 * @param {*} path
 * @param {*} value
 * @param {*} fullType
 * @param {*} exeContext
 */
export function resolveInputObjectDirectives(
  path,
  value,
  fullType,
  exeContext,
  selection
) {
  const { context, info } = exeContext;
  const type = getNullableType(fullType);

  if (type instanceof GraphQLList) {
    return promiseMap(value, (val, index) => {
      resolveInputObjectDirectives(
        { prev: _.cloneDeep(path), key: index },
        val,
        type.ofType,
        exeContext,
        selection.value.values[index]
      );
    });
  }

  // get main type directive resolvers
  const typeExec = getDirectiveResolvers(info, [
    {
      location: objectTypeLocation(type),
      astNode: type.astNode
    }
  ]);

  if (type instanceof GraphQLEnumType) {
    const enumName = selection.value;
    const enumValues = type.getValues();
    const valueDef = _.find(enumValues, { name: enumName }) ||
      _.find(enumValues, { value });
    const valueExec = getDirectiveResolvers(info, [
      {
        location: DirectiveLocation.ENUM_VALUE,
        astNode: valueDef.astNode
      }
    ]);
    return reduceRequestDirectives(
      value,
      typeExec.resolveRequest,
      context,
      info,
      type,
      path
    )
    .then(() => {
      return reduceRequestDirectives(
        value,
        valueExec.resolveRequest,
        context,
        info,
        type,
        path
      );
    });
  } else if (_.isFunction(type.getFields)) {
    const fields = type.getFields();
    const fieldMap = _.mapKeys(selection.value.fields, 'name.value');
    return promiseMap(value, (v, k) => {
      const field = fields[k];
      const fieldExec = getDirectiveResolvers(info, [
        {
          location: DirectiveLocation.INPUT_FIELD_DEFINITION,
          astNode: field.astNode
        }
      ]);
      return reduceRequestDirectives(
        value,
        typeExec.resolveRequest,
        context,
        info,
        type,
        path
      )
      .then(() => {
        return reduceRequestDirectives(
          v,
          fieldExec.resolveRequest,
          context,
          info,
          type,
          path
        );
      })
      .then(() => {
        if (!isSpecifiedScalarType(getNullableType(field.type))) {
          resolveInputObjectDirectives(
            { prev: _.cloneDeep(path), key: k },
            v,
            field.type,
            exeContext,
            fieldMap[k]
          );
        }
      });
    });
  }
}

/**
 * Reduces the request directives overwritting the source value
 * if a value is returned from the directive resolver
 * @param {*} value
 * @param {*} resolveRequest
 * @param {*} context
 * @param {*} attachInfo
 * @param {*} info
 */
export function reduceRequestDirectives(
  value,
  resolveRequest,
  context,
  info,
  parentType,
  path
) {
  const execution = info.operation._factory.execution;
  if (!_.isArray(resolveRequest) || !resolveRequest.length) {
    return Promise.resolve(value);
  }
  return promiseReduce(resolveRequest, (prev, r) => {
    const attachInfo = buildAttachInfo(
      r,
      path,
      parentType,
      info
    );
    const directiveInfo = buildDirectiveInfo(info, r, { attachInfo });
    return instrumentResolver(
      ExecutionType.DIRECTIVE,
      r.directive.name,
      r.resolve.name || 'resolve',
      execution.execution.resolvers,
      directiveInfo,
      r.resolve,
      [ prev, r.args, context, directiveInfo ]
    )
    .then(directiveResult => {
      return directiveResult === undefined ? prev : directiveResult;
    });
  }, value);
}

/**
 * Resolves directives on arguments. Arguments are resolved in parallel
 * but directives on each argument are resolved serially
 * @param {*} field 
 * @param {*} selection 
 * @param {*} context 
 * @param {*} info 
 */
export function resolveArgDirectives(
  field,
  selection,
  context,
  info,
  parentType,
  path
) {
  const args = getArgumentValues(field, selection, info.variableValues);
  const argMap = _.mapKeys(selection.arguments, 'name.value');
  return promiseMap(_.mapKeys(field.args, 'name'), (arg, key) => {
    if (_.has(args, [ key ])) {
      const astNode = arg.astNode;
      const value = args[key];
      const selectionNode = argMap[key];
      const { resolveRequest } = getDirectiveResolvers(info, [
        {
          location: DirectiveLocation.ARGUMENT_DEFINITION,
          astNode
        }
      ]);

      const exeContext = {
        context,
        info
      };

      return reduceRequestDirectives(
        value,
        resolveRequest,
        context,
        info,
        parentType,
        path
      )
      .then(directiveResult => {
        if (directiveResult !== undefined) {
          args[key] = directiveResult;
        }
        if (!isSpecifiedScalarType(getNullableType(arg.type))) {
          return resolveInputObjectDirectives(
            [ key ],
            value,
            arg.type,
            exeContext,
            selectionNode
          );
        }
      });
    }
  })
  .then(() => args);
}

/**
 * Resolve a field containing a resolver and
 * then resolve any sub fields
 * @param {*} source 
 * @param {*} path 
 * @param {*} parentType 
 * @param {*} selection 
 * @param {*} req 
 */
export function resolveField(source, path, parentType, selection, rargs) {
  const [ , , context, info ] = rargs;
  const execution = info.operation._factory.execution;
  const type = getNamedType(parentType);
  const key = selection.name.value;
  const field = typeof type.getFields === 'function' ?
    _.get(type.getFields(), [ key ]) :
    null;
  const resolver = _.get(field, [ 'resolve', '__resolver' ], defaultResolver);

  // if there is no resolver, return the source
  if (!field || typeof resolver !== 'function') {
    return Promise.resolve(_.cloneDeep(source));
  }

  const pathArr = fieldPath(info, true);
  const pathStr = Array.isArray(pathArr) ? pathArr.join('.') : key;
  const isList = getNullableType(field.type) instanceof GraphQLList;
  const fieldType = getNamedType(field.type);

  const { resolveRequest, resolveResult } = getDirectiveResolvers(info, [
    {
      location: objectTypeLocation(type),
      astNode: type.astNode
    },
    {
      location: DirectiveLocation.FIELD_DEFINITION,
      astNode: field.astNode
    },
    {
      location: DirectiveLocation.FIELD,
      astNode: selection
    }
  ]);

  return resolveArgDirectives(
    field,
    selection,
    context,
    info,
    parentType,
    path
  )
    .then(args => {
      return promiseReduce(resolveRequest, (prev, r) => {
        const attachInfo = buildAttachInfo(
          r,
          path,
          parentType,
          info,
          {
            fieldArgs: args,
            fieldName: selection.name.value,
            fieldNodes: [ selection ],
            returnType: field.type,
          }
        );

        const directiveInfo = buildDirectiveInfo(info, r, { attachInfo });
        return instrumentResolver(
          ExecutionType.DIRECTIVE,
          r.directive.name,
          r.resolve.name || 'resolve',
          execution.execution.resolvers,
          directiveInfo,
          r.resolve,
          [ prev, r.args, context, directiveInfo ]
        )
        .then(directiveResult => {
          return directiveResult === undefined ? prev : directiveResult;
        });
      })
      .then(dResult => {
        let skipResolve = dResult instanceof GraphQLSkipResolveInstruction;
        const resolveValue = skipResolve ? dResult.source : dResult;

        // resolve the value or instruction and determine if the resolver
        // should be skipped
        return Promise.resolve(resolveValue)
          .then(directiveResult => {
            if (directiveResult instanceof GraphQLSkipResolveInstruction) {
              skipResolve = true;
              return Promise.resolve(directiveResult.source);
            }
            return directiveResult;
          })
          .then(directiveResult => {
            if (skipResolve) {
              return directiveResult;
            }
            if (directiveResult !== undefined) {
              source[key] = directiveResult;
            }
            return instrumentResolver(
              ExecutionType.RESOLVE,
              pathStr,
              resolver.name || 'resolve',
              info.operation._factory.execution.execution.resolvers,
              info,
              resolver,
              buildFieldResolveArgs(
                source,
                context,
                info,
                path,
                field,
                selection,
                args,
                parentType
              ),
              true
            );
          })
          .then(result => {
            // resolve abstract types
            const resolveType = isAbstractType(fieldType) ?
              fieldType.resolveType ?
                fieldType.resolveType(result, context, info) :
                defaultResolveTypeFn(result, context, info, fieldType) :
              fieldType;

            return Promise.resolve(resolveType).then(runtimeType => {
              return { runtimeType, result };
            });
          })
          .then(({ result, runtimeType }) => {
            const { fields, fragments } = collectFields(
              info,
              runtimeType,
              result,
              selection.selectionSet
            );

            // resolve any fragment resolvers
            const fragLocations = fragments.map(astNode => {
              return {
                location: getFragmentLocation(astNode.kind),
                astNode
              };
            });
            const fragResolvers = getDirectiveResolvers(info, fragLocations);

            // fragments only handle resolve directive middleware currently
            // and can potentially handle resolveResult middleware given
            // valid use cases which are currently not apparent
            // TODO: Determine if the attachInfo is appropriate or should
            // be modified to something other than the field attach info
            return promiseReduce(fragResolvers.resolveRequest, (prev, r) => {
              const attachInfo = buildAttachInfo(
                r,
                path,
                parentType,
                info,
                {
                  fieldArgs: args,
                  fieldName: selection.name.value,
                  fieldNodes: [ selection ],
                  returnType: field.type,
                }
              );
              const directiveInfo = buildDirectiveInfo(info, r, { attachInfo });
              return instrumentResolver(
                ExecutionType.DIRECTIVE,
                r.directive.name,
                r.resolve.name || 'resolve',
                execution.execution.resolvers,
                directiveInfo,
                r.resolve,
                [ prev, r.args, context, directiveInfo ]
              )
              .then(directiveResult => {
                return directiveResult === undefined ? prev : directiveResult;
              });
            })
            .then(directiveResult => {
              return {
                result: directiveResult === undefined ?
                  result :
                  directiveResult,
                fields,
                runtimeType
              };
            });
          })
          .then(({ result, fields, runtimeType }) => {
            // if there are no subfields to resolve, return the results
            if (!fields.length) {
              return result;
            } else if (isList) {
              if (!Array.isArray(result)) {
                return;
              }

              return promiseMap(result, (res, idx) => {
                const listPath = { prev: _.cloneDeep(path), key: idx };
                return resolveSubFields(
                  fields,
                  result[idx],
                  runtimeType,
                  buildFieldResolveArgs(
                    source,
                    context,
                    info,
                    listPath,
                    field,
                    selection,
                    args,
                    parentType
                  )
                );
              })
              .then(() => result);
            }

            return resolveSubFields(
              fields,
              result,
              runtimeType,
              buildFieldResolveArgs(
                source,
                context,
                info,
                path,
                field,
                selection,
                args,
                parentType
              )
            )
            .then(() => result);
          });
      })
      .then(result => {
        return promiseReduce(resolveResult, (prev, r) => {
          const attachInfo = buildAttachInfo(
            r,
            path,
            parentType,
            info,
            {
              fieldArgs: args,
              fieldName: selection.name.value,
              fieldNodes: [ selection ],
              returnType: field.type,
            }
          );
          const directiveInfo = buildDirectiveInfo(info, r, { attachInfo });
          return instrumentResolver(
            ExecutionType.DIRECTIVE,
            r.directive.name,
            r.resolve.name || 'resolveResult',
            execution.execution.resolvers,
            directiveInfo,
            r.resolve,
            [ prev, r.args, context, directiveInfo ]
          );
        }, result)
        .then(directiveResult => {
          return directiveResult === undefined ? result : directiveResult;
        });
      });
    });
}

/**
 * Ported from graphql-js/execution/execute.js
 * @param {*} info 
 * @param {*} parentType 
 * @param {*} result 
 * @param {*} selectionSet 
 * @param {*} fields 
 * @param {*} visitedFragments 
 */
export function collectFields(
  info,
  parentType,
  result,
  selectionSet,
  fieldInfo = { fields: [], fragments: [] },
  visitedFragments = {}
) {
  const type = parentType;
  if (!_.get(selectionSet, 'selections', []).length) {
    return { fields: [], fragments: [] };
  }
  return reduce(selectionSet.selections, (f, selection) => {
    const { kind } = selection;
    const alias = _.get(selection, 'alias.value');
    const nameValue = _.get(selection, 'name.value');
    const name = alias || nameValue;

    if (shouldIncludeNode(info, selection)) {
      switch (kind) {
        case Kind.FIELD:
          f.fields.push({ name, kind, selection });
          break;
        case Kind.FRAGMENT_SPREAD:
          if (!visitedFragments[nameValue]) {
            visitedFragments[nameValue] = true;
            const fragment = getFragment(info, nameValue);
            if (fragment && doesFragmentConditionMatch(info, fragment, type)) {
              f.fragments.push(selection);
              collectFields(
                info,
                type,
                result,
                fragment.selectionSet,
                fieldInfo,
                visitedFragments
              );
            }
          }
          break;
        case Kind.INLINE_FRAGMENT:
          if (doesFragmentConditionMatch(info, selection, type)) {
            f.fragments.push(selection);
            collectFields(
              info,
              type,
              result,
              selection.selectionSet,
              fieldInfo,
              visitedFragments
            );
          }
          break;
        default:
          break;
      }
    }
    return f;
  }, fieldInfo, true);
}

/**
 * performs a custom execution and feeds the resulting data back to
 * the graphql execution. This allows injecting of custom directive
 * resolvers, trace instrumentation, and event logging
 * @param {*} source 
 * @param {*} args 
 * @param {*} context 
 * @param {*} info 
 */
export function factoryExecute(...rargs) {
  const [ source, , context, info ] = rargs;
  const selection = getSelection(info);
  const key = _.get(selection, [ 'alias', 'value' ], selection.name.value);

  // check for root resolver
  if (isRootResolver(info)) {
    if (isFirstSelection(info)) {
      const result = Object.create(null);
      const execution = {
        execution: {
          resolvers: []
        }
      };

      // use the schema and operation locations
      const astLocations = [
        {
          location: DirectiveLocation.SCHEMA,
          astNode: info.schema.astNode
        },
        {
          location: getOperationLocation(info),
          astNode: info.operation
        }
      ];

      // add any fragment definitions as well
      forEach(info.fragments, fragmentAST => {
        astLocations.push({
          location: DirectiveLocation.FRAGMENT_DEFINITION,
          astNode: fragmentAST
        });
      }, true);

      // get the fields and fragments
      const fieldInfo = collectFields(
        info,
        getOperationRootType(info.schema, info.operation),
        result,
        info.operation.selectionSet
      );

      // add fragments
      forEach(fieldInfo.fragments, astNode => {
        astLocations.push({
          location: getFragmentLocation(astNode.kind),
          astNode
        });
      });

      // get the directive middleware
      const {
        resolveRequest,
        resolveResult
      } = getDirectiveResolvers(info, astLocations);

      // perform the entire execution from the first root resolver
      const request = promiseReduce(resolveRequest, (prev, r) => {
        const attachInfo = buildAttachInfo(
          r,
          { prev: undefined, key: undefined },
          null,
          info
        );
        const directiveInfo = buildDirectiveInfo(info, r, { attachInfo });
        return instrumentResolver(
          ExecutionType.DIRECTIVE,
          r.directive.name,
          r.resolve.name || 'resolve',
          execution.execution.resolvers,
          directiveInfo,
          r.resolve,
          [ undefined, r.args, context, directiveInfo ]
        );
      })
      .then(() => {
        return resolveSubFields(
          fieldInfo.fields,
          result,
          info.parentType,
          rargs,
          info.operation.operation === 'mutation'
        );
      })
      .then(() => {
        return promiseReduce(resolveResult, (prev, r) => {
          const attachInfo = buildAttachInfo(
            r,
            { prev: undefined, key: undefined },
            null,
            info
          );
          const directiveInfo = buildDirectiveInfo(info, r, { attachInfo });
          return instrumentResolver(
            ExecutionType.DIRECTIVE,
            r.directive.name,
            r.resolve.name || 'resolveResult',
            execution.execution.resolvers,
            directiveInfo,
            r.resolve,
            [ result, r.args, context, directiveInfo ]
          );
        });
      })
      .then(() => {
        completeExecution(execution, info);
      }, err => {
        completeExecution(execution, info);
        return Promise.reject(err);
      });

      // set the factory metadata key
      info.operation._factory = { execution, result, request };
    }

    // root field selections 1 to n should resolve the promise
    // set by the first field resolver before attempting to get
    // their value from the factory request final result
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        try {
          return info.operation._factory.request.then(() => {
            const result = _.get(info.operation, [ '_factory', 'result', key ]);
            if (result instanceof Error) {
              throw result;
            }
            return result;
          })
          .then(resolve, reject)
          .catch(reject);
        } catch (error) {
          return reject(error);
        }
      });
    });
  }

  // if not the root, check for errors as key values
  // this indicates that an error should be thrown so
  // that graphql can report it normally in the result
  const resultOrError = _.get(source, [ key ]);
    if (resultOrError instanceof Error) {
      throw resultOrError;
    }
    return resultOrError;
}

export function completeExecution(execution, info) {
  const resolvers = execution.execution.resolvers;
  // calculate the overhead and resolver durations
  execution.resolverDuration = _.reduce(resolvers, (total, r) => {
    return total + r.duration;
  }, 0);

  if (_.isObjectLike(info.rootValue)) {
    _.set(info, 'rootValue.__extensions.tracing', execution);
  }
}

// runs as basic graphql execution
export function graphqlExecute(...rargs) {
  const [ source, , , info ] = rargs;
  const selection = getSelection(info);
  return resolveField(
    source,
    info.path,
    info.parentType,
    selection,
    rargs
  );
}
