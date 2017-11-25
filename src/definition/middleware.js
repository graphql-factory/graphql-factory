import {
  get,
  cloneDeep,
  forEach,
  reduce,
  promiseReduce,
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
  GraphQLList
} from 'graphql';
import { extractDirectives } from '../utilities/deconstruct';

export function fieldPath(info) {
  let current = info.path;
  const path = [ current.key ];
  while(current.prev) {
    current = current.prev;
    if (typeof current.key !== 'number') {
      path.push(current.key);
    }
  }
  return path.reverse();
}

export function directiveMap(info) {
  return reduce(info.schema.getDirectives(), (m, directive) => {
    m[directive.name] = directive;
    return m;
  }, Object.create(null));
}

export function isRootResolver(info) {
  return !info.path.prev;
}

export function operationType(info) {
  return info.operation.operation;
}

export function directiveTree(info) {
  const tree = Object.create(null);
  const schema = info.schema;
  const schemaDirectives = extractDirectives(schema.astNode);
  return schemaDirectives;
}

export function getSelection(info) {
  const path = fieldPath(info);
  let key = null;
  let selections = info.operation.selectionSet.selections;

  while (path.length) {
    key = path.shift();
    const selection = selections.filter(s => {
      return s.name.value === key ||
        (s.alias && s.alias.value === key);
    });

    if (!selection.length) {
      throw new Error('Unable to determine selection');
    }
    if (!path.length) {
      return selection[0];
    }
    selections = selection[0].selectionSet.selections;
  }
}

export function mapSubFields(subFields, result, fieldType, req) {
  return Promise.all(subFields.map(subField => {
    return resolveField(result, fieldType, subField.selection, req)
      .then(subResult => {
        result[subField.name] = subResult;
      })
  }))
}

export function resolveField(src, parentType, selection, req) {
  const type = getNamedType(parentType)
  const clone = cloneDeep(src)
  // if the parent type does not have fields, return the source
  if (typeof type.getFields !== 'function') {
    return Promise.resolve(clone);
  }
  const [ source, args, context, info ] = req;
  const key = selection.name.value
  const field = type.getFields()[key];
  const resolver = get(field, [ 'resolve', '__resolver' ])

  // if there is no resolver, return the source
  if (typeof resolver !== 'function') {
    return Promise.resolve(clone);
  }
  const fieldType = getNamedType(field.type);
  const isList = getNullableType(field.type) instanceof GraphQLList;
  const _args = getArgumentValues(field, selection, info.variableValues);
  // TODO: recreate info object with resolve specific info and directives
  const _req = [ clone, _args, context, info ];

  return Promise.resolve(resolver(..._req))
    .then(result => {
      const subFields = collectFields(
        fieldType,
        selection.selectionSet,
        info
      );

      // if there are no subfields to resolve, return the results
      if (!subFields.length) {
        return result;
      }

      if (isList) {
        if (!Array.isArray(result)) {
          return;
        }

        const resolveMap = result.map((res, idx) => {
          return mapSubFields(subFields, result[idx], fieldType, req)
        })
        return Promise.all(resolveMap).then(() => {
          return result;
        });
      }

      return mapSubFields(subFields, result, fieldType, req)
        .then(() => result);
    })
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
  
  // if the field is the root, take control of the execution
  if (isRoot) {
    return resolveField(source, info.parentType, selection, req);
  }

  // if not the root, check for errors as key values
  // this indicates that an error should be thrown so
  // that graphql can report it normally in the result
  const resultOrError = source[key];
  if (resultOrError instanceof Error) {
    throw resultOrError;
  }
  return resultOrError;
}

// runs as basic graphql execution
export function graphqlExecutionMiddleware(req) {
  const [ source, args, context, info ] = req;
  const selection = getSelection(info);
  return resolveField(source, info.parentType, selection, req);
}

/**
 * Main middleware function that is wrapped around all resolvers
 * in the graphql schema
 * @param {*} source 
 * @param {*} args 
 * @param {*} context 
 * @param {*} info 
 */
function middleware(resolver, options) {
  const customExecution = options.factoryExecution !== false;
  const resolve = function (...req) {
    return customExecution ?
      factoryExecutionMiddleware(req) :
      graphqlExecutionMiddleware(req);
  }
  // add the resolver as a property on the resolve middleware
  // function so that when deconstructing the schema the original
  // resolver is preserved. Also add a flag that identifies this 
  // resolver as factory middleware
  resolve.__resolver = resolver;
  resolve.__factoryMiddleware = true;
  return resolve;
}

/**
 * Wraps all of the field resolve functions in middleware handlers
 * @param {*} schema 
 */
export function wrapMiddleware(schema, options) {
  const opts = typeof options === 'object' && options !== null ?
    options :
    Object.create(null);

  forEach(schema.getTypeMap(), (type, typeName) => {
    if (typeName.match(/^__/)) {
      return true;
    } else if (
      type instanceof GraphQLObjectType ||
      type instanceof GraphQLInterfaceType
    ) {
      forEach(type.getFields(), (field, name) => {
        if (
          typeof field.resolve === 'function' &&
          field.resolve.__factoryMiddleware !== true
        ) {
          field.resolve = middleware(field.resolve, opts);
        }
      }, true);  
    }
  }, true);
  return schema;
}
