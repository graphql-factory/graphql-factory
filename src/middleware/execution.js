import {
  get,
  cloneDeep,
  forEach,
  reduce,
  promiseReduce,
  promiseMap,
  isObject
} from '../jsutils';
import {
  GraphQLObjectType,
  GraphQLInterfaceType,
  getArgumentValues
} from '../types/graphql';
import {
  getNamedType,
  getNullableType,
  GraphQLList,
  GraphQLError
} from 'graphql';
import {
  fieldPath,
  directiveMap,
  isRootResolver,
  operationType,
  directiveTree,
  getSelection
} from '../utilities/info'

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

export function resolveSubFields(subFields, result, parentType, req) {
  const [ source, args, context, info ] = req;

  return promiseMap(subFields, subField => {
    const path = {
      prev: cloneDeep(info.path),
      key: subField.name
    }
    const execContext = [
      cloneDeep(source),
      cloneDeep(args),
      context,
      Object.assign(
        Object.create(null),
        info,
        { path, parentType }
      )
    ]
    return resolveField(
      result,
      path,
      parentType,
      subField.selection,
      execContext
    )
      .then(subResult => {
        result[subField.name] = subResult;
        return result;
      })
      .catch(err => {
        result[subField.name] = err;
        return Promise.resolve(result);
      });
  });
}

export function resolveField(
  source,
  path,
  parentType,
  selection,
  req
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
  )

  const _result = new Promise((resolve, reject) => {
    try {
      return Promise.resolve(resolver(...rargs))
        .then(resolve, reject);
    } catch (err) {
      return reject(err);
    }
  })

  return _result
    .then(result => {
      const subFields = collectFields(
        fieldType,
        selection.selectionSet,
        info
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
            )
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
          listPath,
          field,
          selection
        )
      )
      .then(() => result);
    });
}

export function collectFields(parent, selectionSet, info) {
  if (
    !selectionSet
    || typeof parent.getFields !== 'function'
  ) {
    return [];
  }
  const fields = parent.getFields()

  return selectionSet.selections.reduce((resolves, selection) => {
    const name = selection.name.value;
    const field = fields[name];
    const resolver = get(field, [ 'resolve', '__resolver' ]);

    if (typeof resolver === 'function') {
      resolves.push({ name, selection })
    }
    return resolves;
  }, []);
}

// takes control of the execution
export function factoryExecutionMiddleware(req) {
  const [ source, args, context, info ] = req;
  const isRoot = !info.path.prev;
  const selection = getSelection(info);
  const key = selection.name.value;
  const firstSel = info.operation.selectionSet.selections[0];
  const isFirst = firstSel.name.value === info.path.key ||
    (firstSel.alias && firstSel.alias.value === info.path.key);

  
  // if the field is the root, take control of the execution
  if (isRoot) {

    // if the field is the first, resolve the schema and
    // operation middleware and create a promise that
    // can be resolved by all root fields before they
    // execute their code
    if (isFirst) {
      info.operation._factory = {
        execution: {
          start: Date.now(),
          end: -1,
          duration: -1,
          resolves: []
        },
        rootDirectives: Promise.resolve('OK')
      }
    }

    // return a new promise that waits for the nextTick before
    // trying to resolve a custom property on the operation
    // set by factory.
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        return info
        .operation
        ._factory
        .rootDirectives
        .then(() => {
          return resolveField(
            source,
            Object.assign(Object.create(null), info.path),
            info.parentType,
            selection,
            req
          );
        })
        .then(resolve, reject);
      })
    })
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
  const [ source, args, context, info ] = req;
  const selection = getSelection(info);
  return resolveField(
    source,
    info.path,
    info.parentType,
    selection,
    req
  );
}
