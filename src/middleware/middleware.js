import { forEach } from '../jsutils';
import { GraphQLObjectType, GraphQLInterfaceType } from 'graphql';
import { factoryExecute, graphqlExecute } from './execute';

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
  const resolve = function (...rargs) {
    return customExecution ?
      factoryExecute(...rargs) :
      graphqlExecute(...rargs);
  };

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
      forEach(type.getFields(), field => {
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
