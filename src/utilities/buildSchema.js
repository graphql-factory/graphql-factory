import { forEach, isObject } from '../jsutils';
import { omit, merge } from '../jsutils/lodash.custom';
import {
  buildSchema as buildGraphQLSchema,
  isNamedType,
  isDirective,
} from 'graphql';
import { SchemaBacking } from '../definition/backing';
import { request } from './request';

function hydrateSchema(schema, backing) {
  // hydrate types
  forEach(backing.types, (typeDef, typeName) => {
    const type = schema.getType(typeName);
    if (isNamedType(type)) {
      merge(type, omit(typeDef, ['type']));
    }
  });

  // hydrate directives
  forEach(backing.directives, (dirDef, dirName) => {
    const directive = schema.getDirective(dirName);
    if (isDirective(directive)) {
      merge(directive, middleware);
    }
  });

  return schema;
}

export function buildSchema(source: string, backing?: any) {
  // build a schema
  const schema = buildGraphQLSchema(source);

  // if there is a backing validate it and apply it
  if (backing) {
    _backing = new SchemaBacking(backing);
    _backing.fix().validate();
    hydrateSchema(schema, _backing);
  }

  // add a helper method to the schema so that requests
  // can be made with schema.request(source, ...)
  _.set(schema, 'request', (...args) => {
    if (args.length === 1 && args[0] && typeof args[0] === 'object') {
      args[0].schema = schema;
    } else {
      args.splice(0, 0, schema);
    }
    return request(...args);
  });

  return schema;
}
