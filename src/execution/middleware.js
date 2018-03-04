import { forEach, lodash as _ } from '../jsutils';
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
function middleware(definition, resolver, options) {
  const customExecution = options.factoryExecution !== false;
  const resolve = function(source, args, context, info) {
    // ensure that context is an object and extend it
    const ctx = _.isObjectLike(context) ? context : {};
    Object.assign(ctx, definition.context);
    info.definition = definition;

    return customExecution
      ? factoryExecute(source, args, ctx, info)
      : graphqlExecute(source, args, ctx, info);
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
export function wrapMiddleware(definition, schema, options) {
  const opts = Object.assign({}, options);

  forEach(
    schema.getTypeMap(),
    (type, typeName) => {
      if (typeName.match(/^__/)) {
        return true;
      } else if (
        type instanceof GraphQLObjectType ||
        type instanceof GraphQLInterfaceType
      ) {
        forEach(
          type.getFields(),
          field => {
            if (
              typeof field.resolve === 'function' &&
              field.resolve.__factoryMiddleware !== true
            ) {
              field.resolve = middleware(definition, field.resolve, opts);
            }
          },
          true,
        );
      }
    },
    true,
  );
  return schema;
}
