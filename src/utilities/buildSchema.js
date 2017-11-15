// @flow
import { buildSchema } from 'graphql';
import type { SchemaBackingConfig } from '../types/backing';
import { SchemaBacking } from '../types/backing';
import {
  // GraphQLScalarType,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLInterfaceType
} from 'graphql';

function hydrateDirective(schema, directiveName, backing) {
  const name = directiveName.replace(/^@/, '');

  schema._directives.forEach(directive => {
    if (directive.name === name) {
      Object.assign(directive, backing);
    }
  });
}

function hydrateSchema(schema, backing) {
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
        const resolve = keyBacking[fieldName];
        if (typeof resolve !== 'function') {
          return;
        }
        switch (fieldName) {
          /*
          case '_serialize':
            if (type instanceof GraphQLScalarType) {
              type.serialize = resolve;
            }
            break;
          case '_parseValue':
            if (type instanceof GraphQLScalarType) {
              type.parseValue = resolve;
            }
            break;
          case '_parseLiteral':
            if (type instanceof GraphQLScalarType) {
              type.parseLiteral = resolve;
            }
            break;
          */
          case '_isTypeOf':
            if (type instanceof GraphQLObjectType) {
              type.isTypeOf = resolve;
            }
            break;
          case '_resolveType':
            if (type instanceof GraphQLInterfaceType ||
              type instanceof GraphQLUnionType) {
              type.resolveType = resolve;
            }
            break;
          default:
            if (type instanceof GraphQLObjectType ||
              type instanceof GraphQLInterfaceType) {
              type._fields[fieldName].resolve = resolve;
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

  return backing ?
    hydrateSchema(
      schema,
      new SchemaBacking(backing).backing()
    ) :
    schema;
}
