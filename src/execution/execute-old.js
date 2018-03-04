/**
 * Custom graphql execution: This execution is performed from the first
 * field of the root type resolver and returns selections from the resolved
 * data in each of the other fields and subfields. This allows custom
 * middleware to be run at different points in the execution lifecycle
 * using directives. It also allows deep tracing data visibility.
 */
import { getArgumentValues } from 'graphql/execution/values';
import { getOperationRootType } from 'graphql/execution/execute';
import { ExecutionType } from '../definition/const';
import {
  promiseReduce,
  promiseMap,
  lodash as _,
  forEach,
  reduce,
} from '../jsutils';
import { GraphQLSkipResolveInstruction } from '../types';
import {
  Kind,
  getNamedType,
  getNullableType,
  GraphQLList,
  DirectiveLocation,
  defaultFieldResolver,
  isAbstractType,
  isSpecifiedScalarType,
  GraphQLEnumType,
} from 'graphql';
import {
  getDirectiveResolvers,
  buildDirectiveInfo,
  buildAttachInfo,
  objectTypeLocation,
  reduceRequestDirectives,
} from './directives';
import {
  getSelection,
  isFirstSelection,
  isRootResolver,
  fieldPath,
  getOperationLocation,
  getFragmentLocation,
  getFragment,
  doesFragmentConditionMatch,
  getFieldEntryKey,
  shouldIncludeNode,
  defaultResolveTypeFn,
} from '../utilities';
import { instrumentResolver } from './instrumentation';

// create a wrapped default field resolver and add
// a property to identify that it is default
function defaultResolver(...args) {
  return defaultFieldResolver(...args);
}
defaultResolver.__defaultResolver = true;

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
  parentType,
) {
  return [
    _.cloneDeep(source),
    _.cloneDeep(args),
    context,
    Object.assign(Object.create(null), info, {
      parentType,
      fieldName: selection.name.value,
      fieldNodes: [selection],
      fieldDefinition: field,
      returnType: field.type,
      path: _.cloneDeep(path),
    }),
  ];
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
  const [source, args, context, info] = rargs;
  const path = isRoot
    ? { prev: undefined, key: field.key }
    : { prev: _.cloneDeep(info.path), key: field.key };
  const fieldName = isRoot ? field.key : field.name;

  const execContext = [
    _.cloneDeep(source),
    _.cloneDeep(args),
    context,
    Object.assign(Object.create(null), info, { path, parentType }),
  ];

  return resolveField(result, path, parentType, field.selection, execContext)
    .then(subResult => {
      result[fieldName] = subResult;
      return result;
    })
    .catch(error => {
      result[fieldName] = error;
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
export function resolveSubFields(fields, result, parentType, rargs, serial) {
  // if the result is an error resolve it instead of the subfields
  if (result instanceof Error) {
    return Promise.resolve(result);
  }
  const isRoot = typeof serial === 'boolean';

  // resolve tge fields
  return serial
    ? promiseReduce(fields, (res, field) => {
        return resolveSubField(field, result, parentType, rargs, isRoot);
      })
    : promiseMap(fields, field => {
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
) {
  const { context, info, selection } = exeContext;
  const type = getNullableType(fullType);

  if (type instanceof GraphQLList) {
    return promiseMap(value, (val, index) => {
      resolveInputObjectDirectives(
        { prev: _.cloneDeep(path), key: index },
        val,
        type.ofType,
        exeContext,
      );
    });
  }

  // get main type directive resolvers
  const typeExec = getDirectiveResolvers(info, [
    {
      location: objectTypeLocation(type),
      astNode: type.astNode,
    },
  ]);

  if (type instanceof GraphQLEnumType) {
    const enumValues = type.getValues();
    // NOTE: this method of determining the enum value breaks when
    // multiple enums share the same value. Since the raw variable
    // values are not exposed to the resolvers, there is no way to
    // determine the original value when using variables
    const valueDef = _.find(enumValues, { value });
    const valueExec = getDirectiveResolvers(info, [
      {
        location: DirectiveLocation.ENUM_VALUE,
        astNode: valueDef.astNode,
      },
    ]);
    return reduceRequestDirectives(
      value,
      typeExec.resolveRequest,
      context,
      info,
      type,
      path,
      selection,
    ).then(() => {
      return reduceRequestDirectives(
        value,
        valueExec.resolveRequest,
        context,
        info,
        type,
        path,
        selection,
      );
    });
  } else if (_.isFunction(type.getFields)) {
    const fields = type.getFields();
    return promiseMap(value, (v, k) => {
      const field = fields[k];
      const fieldExec = getDirectiveResolvers(info, [
        {
          location: DirectiveLocation.INPUT_FIELD_DEFINITION,
          astNode: field.astNode,
        },
      ]);
      return reduceRequestDirectives(
        value,
        typeExec.resolveRequest,
        context,
        info,
        type,
        path,
        selection,
      )
        .then(() => {
          return reduceRequestDirectives(
            v,
            fieldExec.resolveRequest,
            context,
            info,
            type,
            path,
            selection,
          );
        })
        .then(() => {
          if (!isSpecifiedScalarType(getNullableType(field.type))) {
            resolveInputObjectDirectives(
              { prev: _.cloneDeep(path), key: k },
              v,
              field.type,
              exeContext,
            );
          }
        });
    });
  }
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
  path,
) {
  const args = getArgumentValues(field, selection, info.variableValues);

  return promiseMap(_.mapKeys(field.args, 'name'), (arg, key) => {
    if (_.has(args, [key])) {
      const astNode = arg.astNode;
      const value = args[key];
      const { resolveRequest } = getDirectiveResolvers(info, [
        {
          location: DirectiveLocation.ARGUMENT_DEFINITION,
          astNode,
        },
      ]);

      const exeContext = {
        context,
        info,
        selection,
      };

      return reduceRequestDirectives(
        value,
        resolveRequest,
        context,
        info,
        parentType,
        path,
        selection,
      ).then(directiveResult => {
        if (directiveResult !== undefined) {
          args[key] = directiveResult;
        }
        if (!isSpecifiedScalarType(getNullableType(arg.type))) {
          return resolveInputObjectDirectives(
            [key],
            value,
            arg.type,
            exeContext,
          );
        }
      });
    }
  }).then(() => args);
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
  const [, , context, info] = rargs;
  const execution = info.operation._factory.execution;
  const type = getNamedType(parentType);
  const key = selection.name.value;
  const fieldName = getFieldEntryKey(selection);
  const field =
    typeof type.getFields === 'function'
      ? _.get(type.getFields(), [key])
      : null;
  const resolver = _.get(field, ['resolve', '__resolver'], defaultResolver);

  // if there is no resolver, return the source
  if (!field || typeof resolver !== 'function') {
    return Promise.resolve(_.cloneDeep(source));
  }

  const pathArr = fieldPath(info, true);
  const pathStr = Array.isArray(pathArr) ? pathArr.join('.') : fieldName;
  const isList = getNullableType(field.type) instanceof GraphQLList;
  const fieldType = getNamedType(field.type);

  const { resolveRequest, resolveResult } = getDirectiveResolvers(info, [
    {
      location: objectTypeLocation(type),
      astNode: type.astNode,
    },
    {
      location: DirectiveLocation.FIELD_DEFINITION,
      astNode: field.astNode,
    },
    {
      location: DirectiveLocation.FIELD,
      astNode: selection,
    },
  ]);

  return resolveArgDirectives(
    field,
    selection,
    context,
    info,
    parentType,
    path,
  ).then(args => {
    return promiseReduce(
      resolveRequest,
      (prev, r) => {
        const attachInfo = buildAttachInfo(
          r,
          path,
          parentType,
          info,
          selection,
          {
            fieldSource: source,
            fieldArgs: args,
            fieldName,
            fieldNodes: [selection],
            returnType: field.type,
          },
        );

        const directiveInfo = buildDirectiveInfo(info, r, { attachInfo });
        return instrumentResolver(
          ExecutionType.DIRECTIVE,
          r.directive.name,
          r.resolve.name || 'resolve',
          execution.execution.resolvers,
          directiveInfo,
          r.resolve,
          [prev, r.args, context, directiveInfo],
        ).then(directiveResult => {
          return directiveResult === undefined ? prev : directiveResult;
        });
      },
      _.get(source, [selection.name.value]),
    )
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
              source[path.prev ? key : fieldName] = directiveResult;
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
                parentType,
              ),
              true,
            );
          })
          .then(result => {
            // resolve abstract types
            const resolveType = isAbstractType(fieldType)
              ? fieldType.resolveType
                ? fieldType.resolveType(result, context, info)
                : defaultResolveTypeFn(result, context, info, fieldType)
              : fieldType;

            return Promise.resolve(resolveType).then(runtimeType => {
              return { runtimeType, result };
            });
          })
          .then(({ result, runtimeType }) => {
            const { fields, fragments } = collectFields(
              info,
              runtimeType,
              result,
              selection.selectionSet,
            );

            // resolve any fragment resolvers
            const fragLocations = fragments.map(astNode => {
              return {
                location: getFragmentLocation(astNode.kind),
                astNode,
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
                selection,
                {
                  fieldSource: source,
                  fieldArgs: args,
                  fieldName: selection.name.value,
                  fieldNodes: [selection],
                  returnType: field.type,
                },
              );
              const directiveInfo = buildDirectiveInfo(info, r, { attachInfo });
              return instrumentResolver(
                ExecutionType.DIRECTIVE,
                r.directive.name,
                r.resolve.name || 'resolve',
                execution.execution.resolvers,
                directiveInfo,
                r.resolve,
                [prev, r.args, context, directiveInfo],
              ).then(directiveResult => {
                return directiveResult === undefined ? prev : directiveResult;
              });
            }).then(directiveResult => {
              return {
                result:
                  directiveResult === undefined ? result : directiveResult,
                fields,
                runtimeType,
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
                    parentType,
                  ),
                );
              }).then(() => result);
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
                parentType,
              ),
            ).then(() => result);
          });
      })
      .then(result => {
        return promiseReduce(
          resolveResult,
          (prev, r) => {
            const attachInfo = buildAttachInfo(
              r,
              path,
              parentType,
              info,
              selection,
              {
                fieldSource: source,
                fieldArgs: args,
                fieldName: selection.name.value,
                fieldNodes: [selection],
                returnType: field.type,
              },
            );
            const directiveInfo = buildDirectiveInfo(info, r, { attachInfo });
            return instrumentResolver(
              ExecutionType.DIRECTIVE,
              r.directive.name,
              r.resolve.name || 'resolveResult',
              execution.execution.resolvers,
              directiveInfo,
              r.resolve,
              [prev, r.args, context, directiveInfo],
            );
          },
          result,
        ).then(directiveResult => {
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
  fieldInfo = { fields: {}, fragments: [] },
  visitedFragments = {},
) {
  const type = parentType;
  if (!_.get(selectionSet, 'selections', []).length) {
    return { fields: [], fragments: [] };
  }
  return reduce(
    selectionSet.selections,
    (f, selection) => {
      const { kind } = selection;
      const name = _.get(selection, 'name.value');
      const key = getFieldEntryKey(selection);

      if (shouldIncludeNode(info, selection)) {
        const key = getFieldEntryKey(selection);
        switch (kind) {
          case Kind.FIELD:
            if (!f.fields[key]) {
              f.fields[key] = [];
            }
            f.fields[key].push({ key, name, kind, selection });
            break;
          case Kind.FRAGMENT_SPREAD:
            if (!visitedFragments[name]) {
              visitedFragments[name] = true;
              const fragment = getFragment(info, name);
              if (
                fragment &&
                doesFragmentConditionMatch(info, fragment, type)
              ) {
                f.fragments.push(selection);
                collectFields(
                  info,
                  type,
                  result,
                  fragment.selectionSet,
                  fieldInfo,
                  visitedFragments,
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
                visitedFragments,
              );
            }
            break;
          default:
            break;
        }
      }
      return f;
    },
    fieldInfo,
    true,
  );
}

export function _resolveSubFields(fields, result, parentType, rargs, serial) {
  // if the result is an error resolve it instead of the subfields
  if (result instanceof Error) {
    return Promise.resolve(result);
  }
  const isRoot = typeof serial === 'boolean';

  // resolve tge fields
  return serial
    ? promiseReduce(fields, (res, field) => {
        return resolveSubField(field, result, parentType, rargs, isRoot);
      })
    : promiseMap(fields, field => {
        return resolveSubField(field, result, parentType, rargs, isRoot);
      });
}

export function _resolveSubField(field, parentType, rargs, isRoot) {
  const [source, args, context, info] = rargs;
}

export function buildFieldArgs(source, context, fieldInfo, fieldNodeInfo) {
  const { parentType, variableValues, path } = fieldInfo;
  const fieldDef = parentType.getFields()[fieldNodeInfo.name];
  const info = Object.assign({}, fieldInfo, {
    path: { prev: undefined, key: fieldNodeInfo.key },
    fieldName: fieldNodeInfo.name,
    fieldDef,
  });
  const args = getArgumentValues(
    fieldDef,
    fieldNodeInfo.selection,
    variableValues,
  );
  console.log('FFFF', fieldNodeInfo.selection);
  return [source, args, context, info];
}

export function assignRootField(result, fieldNodeInfo, rargs) {
  const [source, , context, info] = rargs;
  const fieldArgs = buildFieldArgs(undefined, context, info, fieldNodeInfo);
  return null;
}

export function factoryExecute(...rargs) {
  const [source, args, context, info] = rargs;
  const op = info.operation;
  const selection = getSelection(info);
  const name = selection.name.value;
  const key = getFieldEntryKey(selection);

  if (isRootResolver(info)) {
    if (isFirstSelection(info)) {
      const result = Object.create(null);
      const execution = { execution: { resolvers: [] } };
      const fieldInfo = collectFields(
        info,
        getOperationRootType(info.schema, info.operation),
        result,
        info.operation.selectionSet,
      );

      const request =
        op.operation === 'mutation'
          ? promiseReduce(fieldInfo.fields, (accum, fieldNodeInfo) => {
              return assignRootField(result, fieldNodeInfo, rargs);
            })
          : promiseMap(fieldInfo.fields, fieldNodeInfo => {
              return assignRootField(result, fieldNodeInfo, rargs);
            });

      // set custom execution info on the operation
      // so that it is available in each field resolve
      op._factory = { execution, result, request };
    }

    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        try {
          return op._factory.request
            .then(() => {
              const result = _.get(op, ['_factory', 'result', key]);
              if (result instanceof Error) {
                throw result;
              }
              return result;
            })
            .then(resolve)
            .catch(reject);
        } catch (error) {
          return reject(error);
        }
      });
    });
  }

  // for non-root fields, get the named key from the source
  const resultOrError = _.get(source, [name]);
  if (resultOrError instanceof Error) {
    throw resultOrError;
  }
  return resultOrError;
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
export function factoryExecute1(...rargs) {
  const [source, , context, info] = rargs;
  const selection = getSelection(info);
  const key = getFieldEntryKey(selection);

  // check for root resolver
  if (isRootResolver(info)) {
    if (isFirstSelection(info)) {
      const result = Object.create(null);
      const execution = { execution: { resolvers: [] } };

      // use the schema and operation locations
      const astLocations = [
        {
          location: DirectiveLocation.SCHEMA,
          astNode: info.schema.astNode,
        },
        {
          location: getOperationLocation(info),
          astNode: info.operation,
        },
      ];

      // add any fragment definitions as well
      forEach(
        info.fragments,
        fragmentAST => {
          astLocations.push({
            location: DirectiveLocation.FRAGMENT_DEFINITION,
            astNode: fragmentAST,
          });
        },
        true,
      );

      // get the fields and fragments
      const fieldInfo = collectFields(
        info,
        getOperationRootType(info.schema, info.operation),
        result,
        info.operation.selectionSet,
      );

      // add fragments
      forEach(fieldInfo.fragments, astNode => {
        astLocations.push({
          location: getFragmentLocation(astNode.kind),
          astNode,
        });
      });

      // get the directive middleware
      const { resolveRequest, resolveResult } = getDirectiveResolvers(
        info,
        astLocations,
      );

      // perform the entire execution from the first root resolver
      const request = promiseReduce(resolveRequest, (prev, r) => {
        const attachInfo = buildAttachInfo(
          r,
          { prev: undefined, key: undefined },
          null,
          info,
          selection,
        );
        const directiveInfo = buildDirectiveInfo(info, r, { attachInfo });
        return instrumentResolver(
          ExecutionType.DIRECTIVE,
          r.directive.name,
          r.resolve.name || 'resolve',
          execution.execution.resolvers,
          directiveInfo,
          r.resolve,
          [undefined, r.args, context, directiveInfo],
        );
      })
        .then(() => {
          return resolveSubFields(
            fieldInfo.fields,
            result,
            info.parentType,
            rargs,
            info.operation.operation === 'mutation',
          );
        })
        .then(() => {
          return promiseReduce(resolveResult, (prev, r) => {
            const attachInfo = buildAttachInfo(
              r,
              { prev: undefined, key: undefined },
              null,
              info,
              selection,
            );
            const directiveInfo = buildDirectiveInfo(info, r, { attachInfo });
            return instrumentResolver(
              ExecutionType.DIRECTIVE,
              r.directive.name,
              r.resolve.name || 'resolveResult',
              execution.execution.resolvers,
              directiveInfo,
              r.resolve,
              [result, r.args, context, directiveInfo],
            );
          });
        })
        .then(
          () => {
            completeExecution(execution, info);
          },
          err => {
            completeExecution(execution, info);
            return Promise.reject(err);
          },
        );

      // set the factory metadata key
      info.operation._factory = { execution, result, request };
    }

    // root field selections 1 to n should resolve the promise
    // set by the first field resolver before attempting to get
    // their value from the factory request final result
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        try {
          return info.operation._factory.request
            .then(() => {
              const result = _.get(info.operation, ['_factory', 'result', key]);
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
  const resultOrError = _.get(source, [selection.name.value]);
  if (resultOrError instanceof Error) {
    throw resultOrError;
  }
  return resultOrError;
}

export function completeExecution(execution, info) {
  const resolvers = execution.execution.resolvers;
  // calculate the overhead and resolver durations
  execution.resolverDuration = _.reduce(
    resolvers,
    (total, r) => {
      return total + r.duration;
    },
    0,
  );

  if (_.isObjectLike(info.rootValue)) {
    _.set(info, 'rootValue.__extensions.tracing', execution);
  }
}

// runs as basic graphql execution
export function graphqlExecute(...rargs) {
  const [source, , , info] = rargs;
  const selection = getSelection(info);
  return resolveField(source, info.path, info.parentType, selection, rargs);
}
