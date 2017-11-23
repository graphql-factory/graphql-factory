import { forEach } from '../jsutils';
import {
  GraphQLObjectType,
  GraphQLInterfaceType
} from '../types/graphql';

/**
 * Main middleware function that is wrapped around all resolvers
 * in the graphql schema
 * @param {*} source 
 * @param {*} args 
 * @param {*} context 
 * @param {*} info 
 */
function middleware(resolver) {
  const resolve = function (source, args, context, info) {
    return resolver(source, args, context, info);
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
export function wrapMiddleware(schema) {
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
          field.resolve = middleware(field.resolve);
        }
      }, true);  
    }
  }, true);
  return schema;
}
