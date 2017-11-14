// @flow
import { buildSchema } from 'graphql';
import { SchemaBacking } from '../types/backing';

function hydrateDirective (schema, directiveName, backing) {
  var name = directiveName.replace(/^@/, '');

  schema._directives.forEach(directive => {
    if (directive.name === name) {
      Object.assign(directive, backing);
    }
  });
}

function hydrateSchema (schema, backing) {
  Object.keys(backing).forEach(key => {
    var keyBacking = backing[key];

    // check for directive backing
    if (key.match(/^@/)) {
      hydrateDirective(schema, key, keyBacking);
      return;
    }

    // check for type
    if (schema._typeMap[key]) {
      var type = schema._typeMap[key];

      Object.keys(keyBacking).forEach(fieldName => {
        var resolve = keyBacking[fieldName]
        if (type._fields[fieldName] && typeof resolve === 'function') {
          type._fields[fieldName].resolve = resolve;
        }
      })
    }
  });
  return schema;
}

export default function buildFactorySchema (
  source: string,
  backing: ?{ [string]: mixed }
) {
  const schema = buildSchema(source)
  return backing ?
    hydrateSchema(
      schema,
      new SchemaBacking(backing).backing
    ) :
    schema;
}