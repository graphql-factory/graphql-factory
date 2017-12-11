import { forEach, isObject } from '../jsutils';

export function fixArg(definition, args, name, options) {
  if (typeof args[name] === 'string') {
    args[name] = { type: args[name] };
  }
}

export function fixField(definition, fields, name, options) {
  if (typeof fields[name] === 'string') {
    fields[name] = { type: fields[name] };
  }
  forEach(fields[name].args, (argDef, argName) => {
    fixArg(definition, fields[name].args, argName, options);
  }, true);
}

export function fixTypes(definition, types, options) {
  forEach(types, typeDef => {
    switch (typeDef.type) {
      case 'Object':
      case 'Interface':
        forEach(typeDef.fields, (fieldDef, fieldName) => {
          fixField(definition, typeDef.fields, fieldName, options);
        }, true);
        break;
      default:
        break;
    }
  }, true);
}

export function fixDefinition(definition, options) {
  const opts = isObject(options) ? options : {};

  forEach(definition, (config, key) => {
    switch (key) {
      case 'directives':
        break;
      case 'types':
        fixTypes(definition, config, options);
        break;
      case 'schema':
        break;
      default:
        break;
    }
  }, true);
}
