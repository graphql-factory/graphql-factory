/**
 * @flow
 */
import type { GraphQLSchema } from 'graphql';
import type { SchemaBackingConfig } from '../definition/backing';
import { request } from '../utilities/request';
import { lodash as _, forEach } from '../jsutils';
import { SchemaBacking } from '../definition/backing';
import {
  buildSchema as buildGraphQLSchema,
  GraphQLObjectType,
  GraphQLError
} from 'graphql';

/**
 * Adds a root resolver if none exist
 * @param {*} type 
 */
export function ensureRootResolver(type?: ?GraphQLObjectType) {
  if (type instanceof GraphQLObjectType) {
    forEach(type.getFields(), field => {
      if (!_.isFunction(field, 'resolve')) {
        field.resolve = function noResolve (source, args, context, info) {
          throw new GraphQLError('root field "' + info.fieldName +
          '" has no resolver configured');
        };
      }
    }, true);
  } 
}

/**
 * Applies backing functions and other potential extenssion data
 * to graphql types and fields that cannot be represented by 
 * Schema Definition Language using a SchemaBackingConfig
 * @param {*} schema 
 * @param {*} backing 
 */
export function hydrateSchema(
  schema: GraphQLSchema,
  backing: SchemaBackingConfig
) {
  // hydrate types
  forEach(backing.types, (_backing, name) => {
    const type = _.get(schema, [ '_typeMap', name ]);
    if (type) {
      // merge non-field resolvers
      _.merge(
        type,
        _.omit(_backing, [ 'fields' ])
      );

      // merge field resolvers
      _.merge(
        _.get(type, [ '_fields' ]),
        _.get(_backing, [ 'fields' ], {})
      );
    }
  }, true);

  // hydrate directives
  forEach(backing.directives, (_backing, name) => {
    const directive = _.find(schema._directives, { name });
    if (directive) {
      _.merge(directive, _backing);
    }
  }, true);

  return schema;
}

/**
 * Builds a new schema from schema language and optionally
 * hydrates it with a SchemaBacking
 * @param {*} source 
 * @param {*} backing 
 */
export function buildSchema(
  source: string,
  backing?: ?SchemaBackingConfig | ?SchemaBacking
) {
  let _backing = null;

  // if there is a backing, validate it
  if (backing) {
    _backing = new SchemaBacking(backing);
    _backing.validate();
  }

  // use the graphql-js buildSchema method 
  // to build an un-hydrated schema
  const schema = buildGraphQLSchema(source);

  // ensure each root field has a resolver that throws an error
  // saying that it should be defined. when using the @resolve
  // directive these will be ignored
  ensureRootResolver(schema.getQueryType());
  ensureRootResolver(schema.getMutationType());
  ensureRootResolver(schema.getSubscriptionType());


  // add a helper method to the schema so that requests
  // can be made with schema.request(source, ...)
  _.set(schema, 'request', (...args) => {
    if (args.length === 1 && _.isObjectLike(args[0])) {
      args[0].schema = schema;
    } else {
      args.splice(0, 0, schema);
    }
    return request(...args);
  });

  // hydrate the schema if a backing is passed
  // also attempt to create a new SchemaBacking
  // which will run a validation on the backing
  return _backing ?
    hydrateSchema(
      schema,
      _backing.backing
    ) :
    schema;
}
