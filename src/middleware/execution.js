import {
  get,
  cloneDeep,
  promiseReduce,
  promiseMap
} from '../jsutils';
import {
  getArgumentValues,
  DirectiveLocation
} from '../types/graphql';
import {
  getNamedType,
  getNullableType,
  GraphQLList
} from 'graphql';
import {
  getSelection
} from '../utilities/info';
import {
  getDirectiveExec,
  buildDirectiveInfo
} from './directives';

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
        path
      }
    )
  ];
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
  directiveLocations
) {
  const [ source, args, context, info ] = req;
  const path = {
    prev: cloneDeep(info.path),
    key: subField.name
  };

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
        directiveLocations
      );
    }) :
    promiseMap(subFields, subField => {
      return resolveSubField(
        subField,
        result,
        parentType,
        req,
        directiveLocations
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
  const type = getNamedType(parentType);
  const key = selection.name.value;
  const field = typeof type.getFields === 'function' ?
    get(type.getFields(), [ key ]) :
    null;
  const resolver = get(field, [ 'resolve', '__resolver' ]);

  // if there is no resolver, return the source
  if (!field || typeof resolver !== 'function') {
    return Promise.resolve(cloneDeep(source));
  }
  const isList = getNullableType(field.type) instanceof GraphQLList;
  const fieldType = getNamedType(field.type);
  const rargs = buildFieldResolveArgs(
    source,
    context,
    info,
    path,
    field,
    selection
  );

  const _result = new Promise((resolve, reject) => {
    try {
      return Promise.resolve(resolver(...rargs))
        .then(resolve, reject);
    } catch (err) {
      return reject(err);
    }
  });

  return _result
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
  const fields = parent.getFields();

  return selectionSet.selections.reduce((resolves, selection) => {
    const name = selection.name.value;
    const field = fields[name];
    const resolver = get(field, [ 'resolve', '__resolver' ]);

    if (typeof resolver === 'function') {
      resolves.push({
        name: get(selection, [ 'alias', 'value' ], name),
        selection
      });
    }
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

      info.operation._factory = {
        execution: {
          start: Date.now(),
          end: -1,
          duration: -1,
          resolves: []
        },
        final,
        request: resolveSubFields(
          rootFields,
          final,
          info.parentType,
          req,
          operationDirectiveLocs,
          info.operation.operation === 'mutation'
        ),
        req: promiseReduce(
          resolveRequest.map(r => {
            return Promise.resolve(
              r.resolve(
                undefined,
                r.args,
                context,
                buildDirectiveInfo(info, r)
              )
            );
          }),
          prev => prev
        )
          .then(() => {
            return resolveSubFields(
              rootFields,
              final,
              info.parentType,
              req,
              info.operation.operation === 'mutation'
            );
          })
          .then(() => {
            return promiseReduce(
              resolveResult.map(r => {
                return Promise.resolve(
                  r.resolve(
                    final,
                    r.args,
                    context,
                    buildDirectiveInfo(info, r)
                  )
                );
              }),
              prev => prev
            );
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
        .then(resolve, reject);
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
