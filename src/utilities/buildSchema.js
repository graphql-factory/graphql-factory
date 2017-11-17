// @flow
import type {
  GraphQLSchema
} from '../types/graphql.js';
import {
  buildSchema,
  GraphQLScalarType,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLInterfaceType
} from '../types/graphql';
import {
  set
} from '../jsutils';

import type {
  SchemaBackingConfig,
  SchemaBackingFieldConfig
} from '../types/backing';
import {
  SchemaBacking
} from '../types/backing';

/**
 * Adds directive resolvers to a standard GraphQLDirective object
 * if resolvers are present in the backing
 * @param {*} schema 
 * @param {*} directiveName 
 * @param {*} backing 
 */
export function hydrateDirective(
  schema: GraphQLSchema,
  directiveName: string,
  backing: SchemaBackingFieldConfig
) {
  const name = directiveName.replace(/^@/, '');

  schema._directives.forEach(directive => {
    if (directive.name === name) {
      if (typeof backing.resolveRequest === 'function') {
        set(directive, 'resolveRequest', backing.resolveRequest);
      }
      if (typeof backing.resolveResult === 'function') {
        set(directive, 'resolveResult', backing.resolveResult);
      }
    }
  });
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
  Object.keys(backing).forEach(key => {
    const keyBacking = backing[key];

    // check for directive backing
    if (key.match(/^@/)) {
      hydrateDirective(schema, key, keyBacking);
      return;
    }

    // check for type
    if (schema._typeMap[key]) {
      const type = schema._typeMap[key];

      Object.keys(keyBacking).forEach(fieldName => {
        switch (fieldName) {
          case '_serialize':
            if (type instanceof GraphQLScalarType &&
              typeof keyBacking._serialize === 'function') {
              set(type, 'serialize', keyBacking._serialize);
            }
            break;
          case '_parseValue':
            if (type instanceof GraphQLScalarType &&
              typeof keyBacking._parseValue === 'function') {
              set(type, 'parseValue', keyBacking._parseValue);
            }
            break;
          case '_parseLiteral':
            if (type instanceof GraphQLScalarType &&
              typeof keyBacking._parseLiteral === 'function') {
              set(type, 'parseLiteral', keyBacking._parseLiteral);
            }
            break;
          case '_isTypeOf':
            if (type instanceof GraphQLObjectType &&
              typeof keyBacking._isTypeOf === 'function') {
              set(type, 'isTypeOf', keyBacking._isTypeOf);
            }
            break;
          case '_resolveType':
            if ((type instanceof GraphQLInterfaceType ||
              type instanceof GraphQLUnionType) &&
              typeof keyBacking._resolveType === 'function') {
              set(type, 'resolveType', keyBacking._resolveType);
            }
            break;
          default:
            if ((type instanceof GraphQLObjectType ||
              type instanceof GraphQLInterfaceType) &&
              typeof keyBacking[fieldName] === 'function') {
              type._fields[fieldName].resolve = keyBacking[fieldName];
            }
        }
      });
    }
  });
  return schema;
}

export default function buildFactorySchema(
  source: string,
  backing?: ?SchemaBackingConfig | ?SchemaBacking
) {
  const schema = buildSchema(source);

  // hydrate the schema if a backing is passed
  // also attempt to create a new SchemaBacking
  // which will run a validation on the backing
  return !backing ?
    schema :
    hydrateSchema(
      schema,
      new SchemaBacking(backing).backing()
    );
}
