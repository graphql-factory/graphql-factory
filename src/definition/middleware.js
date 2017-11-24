import {
  forEach,
  reduce,
  promiseReduce
} from '../jsutils';
import {
  GraphQLObjectType,
  GraphQLInterfaceType
} from '../types/graphql';
import { extractDirectives } from '../utilities/deconstruct';

export function fieldPath(info) {
  let current = info.path;
  const path = [ current.key ];
  while(current.prev) {
    current = current.prev;
    path.push(current.key)
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

function resolveFields() {

}

// takes control of the execution
function factoryExecutionMiddleware(resolver, req) {
  const [ source, args, context, info ] = req;
  const isRoot = !info.path.prev;
  const selection = getSelection(info);
  const key = selection.name.value;

  if (isRoot) {
    return resolver(...req);
  }
  return source[key];
}

// runs as basic graphql execution
function graphqlExecutionMiddleware(resolver, req) {
  const [ source, args, context, info ] = req;
  console.log(directiveTree(info))
  return resolver(...req);
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
      factoryExecutionMiddleware(resolver, req) :
      graphqlExecutionMiddleware(resolver, req);
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
