import { forEach } from '../jsutils';
import { NamedType } from './const';

export function fixArg(definition, args, name) {
  if (typeof args[name] === 'string') {
    args[name] = { type: args[name] };
  }
}

export function fixField(definition, fields, name) {
  if (typeof fields[name] === 'string') {
    fields[name] = { type: fields[name] };
  }
  forEach(fields[name].args, (argDef, argName) => {
    fixArg(definition, fields[name].args, argName);
  }, true);
}

export function fixTypes(definition, types) {
  forEach(types, typeDef => {
    switch (typeDef.type) {
      case NamedType.OBJECT:
      case NamedType.INTERFACE:
        forEach(typeDef.fields, (fieldDef, fieldName) => {
          fixField(definition, typeDef.fields, fieldName);
        }, true);
        break;
      default:
        break;
    }
  }, true);
}

export function fixDefinition(definition) {
  forEach(definition, (config, key) => {
    switch (key) {
      case 'directives':
        break;
      case 'types':
        fixTypes(definition, config);
        break;
      case 'schema':
        break;
      default:
        break;
    }
  }, true);
  return definition;
}
