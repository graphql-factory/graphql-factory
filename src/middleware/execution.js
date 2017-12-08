/**
 * Custom graphql execution
 * 
 * The following execution "hijacks" the graphql execution
 * by using the first field resolver in the root type to complete
 * the entire execution and supply its data to the subsequent field
 * resolvers. It does this by wraping every field resolve in a
 * function that determines if it should execute code or wait till
 * data is supplied to it. This allows custom directive middleware,
 * logging, and other non-standard functionality while still using
 * the graphql execution to perform the request making the schema
 * usable in any environment.
 * 
 * Unhandled middleware - The following do not have middleware applied
 * because they represent types that should only be included or excluded
 * which is handled by the build in directives
 * - FRAGMENT_DEFINITION
 * - FRAGMENT_SPREAD
 * - INLINE_FRAGMENT
 * - ARGUMENT_DEFINITION
 * - ENUM_VALUE
 * - INPUT_OBJECT
 * - INPUT_FIELD_DEFINITION
 * 
 */
import {
  get,
  cloneDeep,
  promiseReduce,
  promiseMap,
  noop,
  pick
} from '../jsutils';
import {
  getArgumentValues
} from 'graphql/execution/values';
import {
  defaultFieldResolver,
  DirectiveLocation,
  getNamedType,
  getNullableType,
  GraphQLList
} from 'graphql';
import {
  getSelection,
  fieldPath
} from '../utilities/info';
import {
  getDirectiveExec,
  buildDirectiveInfo,
  objectTypeLocation
} from './directives';

export const ExecutionType = {
  RESOLVE: 'RESOLVE',
  DIRECTIVE: 'DIRECTIVE'
};

export const TRACING_VERSION = '1.0.0';

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
  selection
) {
  return [
    cloneDeep(source),
    getArgumentValues(field, selection, info.variableValues),
    context,
    Object.assign(
      Object.create(null),
      info,
      {
        fieldName: selection.name.value,
        fieldNodes: [ selection ],
        returnType: field.type,
        path: cloneDeep(path)
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
  execution.end = Date.now();
  execution.duration = execution.end - execution.start;

  if (result instanceof Error) {
    execution.error = result;
  }

  // do not trace default resolvers
  if (!isDefault) {
    stack.push(execution);
  }
}

/**
 * Creates and updates an object that contains run time details for
 * a specific resolver
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
  const execution = {
    type,
    name,
    resolverName,
    start: Date.now(),
    end: -1,
    duration: -1,
    info: pick(info, 'location', 'path'),
    error: null
  };

  const isDefault = resolver.__defaultResolver;

  try {
    return Promise.resolve(resolver(...args))
      .then(result => {
        calculateRun(stack, execution, result, isDefault);
        return result;
      }, err => {
        calculateRun(stack, execution, err, isDefault);
        return resolveErrors ?
          Promise.resolve(err) :
          Promise.reject(err);
      });
  } catch (err) {
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
 * @param {*} subField 
 * @param {*} result 
 * @param {*} parentType 
 * @param {*} req 
 */
export function resolveSubField(
  subField,
  result,
  parentType,
  req,
  directiveLocations,
  isRoot
) {
  const [ source, args, context, info ] = req;
  const path = isRoot ?
    { prev: undefined, key: subField.name } :
    { prev: cloneDeep(info.path), key: subField.name };

  const execContext = [
    cloneDeep(source),
    cloneDeep(args),
    context,
    Object.assign(
      Object.create(null),
      info,
      { path, parentType }
    )
  ];

  return resolveField(
    result,
    path,
    parentType,
    subField.selection,
    execContext,
    directiveLocations
  )
    .then(subResult => {
      result[subField.name] = subResult;
      return result;
    })
    .catch(err => {
      result[subField.name] = err;
      return Promise.resolve(result);
    });
}

/**
 * Resolves subfields either serially if a root
 * mutation field or in parallel if not
 * @param {*} subFields 
 * @param {*} result 
 * @param {*} parentType 
 * @param {*} req 
 * @param {*} serial 
 */
export function resolveSubFields(
  subFields,
  result,
  parentType,
  req,
  directiveLocations,
  serial
) {
  // execute serialy if serial is indicated
  return serial ?
    promiseReduce(subFields, (res, subField) => {
      return resolveSubField(
        subField,
        result,
        parentType,
        req,
        directiveLocations,
        typeof serial === 'boolean' // only root fields should be boolean
      );
    }) :
    promiseMap(subFields, subField => {
      return resolveSubField(
        subField,
        result,
        parentType,
        req,
        directiveLocations,
        typeof serial === 'boolean' // only root fields should be boolean
      );
    });
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
export function resolveField(
  source,
  path,
  parentType,
  selection,
  req,
  directiveLocations
) {
  const [ , , context, info ] = req;
  const execution = info.operation._factory.execution;
  const type = getNamedType(parentType);
  const key = selection.name.value;
  const field = typeof type.getFields === 'function' ?
    get(type.getFields(), [ key ]) :
    null;
  const resolver = get(
    field,
    [ 'resolve', '__resolver' ],
    defaultResolver
  );

  // if there is no resolver, return the source
  if (!field || typeof resolver !== 'function') {
    return Promise.resolve(cloneDeep(source));
  }
  const pathArr = fieldPath(info, true);
  const pathStr = Array.isArray(pathArr) ? pathArr.join('.') : key;
  const isList = getNullableType(field.type) instanceof GraphQLList;
  const fieldType = getNamedType(field.type);
  const resolveRequest = [];
  const resolveResult = [];

  // get current directives
  const objDirectiveLocs = getDirectiveExec(
    type.astNode,
    objectTypeLocation(type),
    info,
    resolveRequest,
    resolveResult,
    directiveLocations
  );

  const fieldDefDirectiveLocs = getDirectiveExec(
    field.astNode,
    DirectiveLocation.FIELD_DEFINITION,
    info,
    resolveRequest,
    resolveResult,
    objDirectiveLocs
  );

  const fieldDirectiveLocs = getDirectiveExec(
    selection,
    DirectiveLocation.FIELD,
    info,
    resolveRequest,
    resolveResult,
    fieldDefDirectiveLocs
  );

  // TODO: remove this
  noop(fieldDirectiveLocs);

  return promiseReduce(resolveRequest, (prev, r) => {
    const directiveInfo = buildDirectiveInfo(info, r);
    return instrumentResolver(
      ExecutionType.DIRECTIVE,
      r.directive.name,
      r.resolve.name || 'resolve',
      execution.resolvers,
      directiveInfo,
      r.resolve,
      [ prev, r.args, context, directiveInfo ]
    )
    .then(directiveResult => {
      return directiveResult === undefined ?
      prev :
      directiveResult;
    });
  })
  .then(directiveResult => {
    // allow setting of 
    if (directiveResult !== undefined) {
      source[key] = directiveResult;
    }
    // build the resolver args
    const rargs = buildFieldResolveArgs(
      source,
      context,
      info,
      path,
      field,
      selection
    );

    return instrumentResolver(
      ExecutionType.RESOLVE,
      pathStr,
      resolver.name || 'resolve',
      info.operation._factory.execution.resolvers,
      info,
      resolver,
      rargs,
      true
    )
      .then(result => {
        const subFields = collectFields(
          fieldType,
          selection.selectionSet
        );

        // if there are no subfields to resolve, return the results
        if (!subFields.length) {
          return result;
        } else if (isList) {
          if (!Array.isArray(result)) {
            return;
          }

          return promiseMap(result, (res, idx) => {
            const listPath = { prev: cloneDeep(path), key: idx };
            return resolveSubFields(
              subFields,
              result[idx],
              fieldType,
              buildFieldResolveArgs(
                source,
                context,
                info,
                listPath,
                field,
                selection
              ),
              directiveLocations
            );
          })
          .then(() => result);
        }

        return resolveSubFields(
          subFields,
          result,
          fieldType,
          buildFieldResolveArgs(
            source,
            context,
            info,
            path,
            field,
            selection
          ),
          directiveLocations
        )
        .then(() => result);
      });
  })
  .then(result => {
    return promiseReduce(resolveResult, (prev, r) => {
      const directiveInfo = buildDirectiveInfo(info, r);
      return instrumentResolver(
        ExecutionType.DIRECTIVE,
        r.directive.name,
        r.resolve.name || 'resolveResult',
        execution.resolvers,
        directiveInfo,
        r.resolve,
        [ prev, r.args, context, directiveInfo ]
      );
    }, result)
    .then(directiveResult => {
      return directiveResult === undefined ?
        result :
        directiveResult;
    });
  });
}

/**
 * Builds a map of fields with resolve functions to resolve
 * @param {*} parent 
 * @param {*} selectionSet 
 * @param {*} info 
 */
export function collectFields(parent, selectionSet) {
  if (!selectionSet || typeof parent.getFields !== 'function') {
    return [];
  }
  // const fields = parent.getFields();

  return selectionSet.selections.reduce((resolves, selection) => {
    const name = selection.name.value;
    resolves.push({
      name: get(selection, [ 'alias', 'value' ], name),
      selection
    });
    return resolves;
  }, []);
}

/**
 * Takes control of the execution by executing the entire
 * operation from the first field in the operation and
 * then supplying the results to the resolve in graphql's
 * execution. This allows the operation lifecycle to be
 * completely controlled while still using graphql's executuion
 * method
 * @param {*} req 
 */
export function factoryExecutionMiddleware(req) {
  const [ source, , context, info ] = req;
  const isRoot = !info.path.prev;
  const selection = getSelection(info);
  const key = get(selection, [ 'alias', 'value' ], selection.name.value);
  const firstSel = info.operation.selectionSet.selections[0];
  const isFirst = firstSel.name.value === info.path.key ||
    (firstSel.alias && firstSel.alias.value === info.path.key);
  const operationLocation = info.operation.operation === 'query' ?
    DirectiveLocation.QUERY :
    info.operation.operation === 'mutation' ?
      DirectiveLocation.MUTATION :
      DirectiveLocation.SUBSCRIPTION;

  // if the field is the root, take control of the execution
  if (isRoot) {
    // if the field is the first, resolve the schema and
    // operation middleware and create a promise that
    // can be resolved by all root fields before they
    // execute their code
    if (isFirst) {
      const logger = get(info, [ 'rootValue', 'logger' ], noop);
      const resolveRequest = [];
      const resolveResult = [];
      const directiveLocations = Object.create(null);

      // get schema directives
      const schemaDirectiveLocs = getDirectiveExec(
        info.schema.astNode,
        DirectiveLocation.SCHEMA,
        info,
        resolveRequest,
        resolveResult,
        directiveLocations
      );

      // get operation directives
      const operationDirectiveLocs = getDirectiveExec(
        info.operation,
        operationLocation,
        info,
        resolveRequest,
        resolveResult,
        schemaDirectiveLocs
      );

      // get the root fields to resolve
      const rootFields = collectFields(
        info.parentType,
        info.operation.selectionSet
      );

      // store the final result
      const final = Object.create(null);

      // store the execution details
      const execution = {
        version: TRACING_VERSION,
        start: Date.now(),
        end: -1,
        duration: -1,
        resolvers: [],
        operation: Object.assign(
          Object.create(null),
          info.operation
        )
      };

      info.operation._factory = {
        logger,
        execution,
        final,
        request: promiseReduce(resolveRequest, (prev, r) => {
          const directiveInfo = buildDirectiveInfo(info, r);
          return instrumentResolver(
            ExecutionType.DIRECTIVE,
            r.directive.name,
            r.resolve.name || 'resolve',
            execution.resolvers,
            directiveInfo,
            r.resolve,
            [ undefined, r.args, context, directiveInfo ]
          );
        })
        .then(() => {
          return resolveSubFields(
            rootFields,
            final,
            info.parentType,
            req,
            operationDirectiveLocs,
            info.operation.operation === 'mutation'
          );
        })
        .then(() => {
          return promiseReduce(resolveResult, (prev, r) => {
            const directiveInfo = buildDirectiveInfo(info, r);
            return instrumentResolver(
              ExecutionType.DIRECTIVE,
              r.directive.name,
              r.resolve.name || 'resolveResult',
              execution.resolvers,
              directiveInfo,
              r.resolve,
              [ final, r.args, context, directiveInfo ]
            );
          });
        })
        .then(() => {
          execution.end = Date.now();
          execution.duration = execution.end - execution.start;
          info.operation._factory.logger('execution', execution);
        }, err => {
          execution.end = Date.now();
          execution.duration = execution.end - execution.start;
          info.operation._factory.logger('execution', execution);
          return Promise.reject(err);
        })
      };
    }

    // return a new promise that waits for the nextTick before
    // trying to resolve a custom property on the operation
    // set by factory.
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        return info
        .operation
        ._factory
        .request
        .then(() => {
          // get the result from the factory operation metadata
          // and default undefined
          const result = get(info.operation,
            [ '_factory', 'final', key ]
          );
          if (result instanceof Error) {
            throw result;
          }
          return result;
        })
        .then(resolve, reject)
        .catch(reject);
      });
    });
  }

  // if not the root, check for errors as key values
  // this indicates that an error should be thrown so
  // that graphql can report it normally in the result
  const resultOrError = get(source, [ key ]);

  if (resultOrError instanceof Error) {
    throw resultOrError;
  }

  return resultOrError;
}

// runs as basic graphql execution
export function graphqlExecutionMiddleware(req) {
  const [ source, , , info ] = req;
  const selection = getSelection(info);
  return resolveField(
    source,
    info.path,
    info.parentType,
    selection,
    req
  );
}
