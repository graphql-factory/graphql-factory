import { lodash as _, forEach } from '../jsutils';
import { NamedType, EventType } from './const';

/**
 * Fixes shorthand on arg
 * @param {*} args 
 * @param {*} name 
 */
export function fixArg(args, name) {
  if (_.isString(args[name])) {
    args[name] = { type: args[name] };
  }
}

/**
 * Fixes shorthand on field
 * @param {*} fields 
 * @param {*} name 
 */
export function fixField(fields, name) {
  if (_.isString(fields[name])) {
    fields[name] = { type: fields[name] };
  }
  forEach(fields[name].args, (argDef, argName) => {
    fixArg.call(this, fields[name].args, argName);
  }, true);
}

/**
 * Fixes shorthand on value
 * @param {*} values 
 * @param {*} name 
 */
export function fixValue(values, name) {
  if (_.isString(values[name])) {
    values[name] = { value: values[name] };
  }
}

/**
 * Determines type if missing and fixes shorthand
 * on fields, values, and args
 * @param {*} types 
 */
export function fixTypes(types) {
  forEach(types, (typeDef, typeName) => {
    // if no type is specified, try to determine it from
    // the properties of the definition
    if (!_.isString(typeDef.type)) {
      if (_.isObjectLike(typeDef.fields)) {
        typeDef.type = _.isFunction(typeDef.resolveType) ?
          NamedType.INTERFACE :
          NamedType.OBJECT;
      } else if (_.isObjectLike(typeDef.values)) {
        typeDef.type = NamedType.ENUM;
      } else if (_.isArray(typeDef.types)) {
        typeDef.type = NamedType.UNION;
      } else if (
        _.isFunction(typeDef.serialize) ||
        _.isFunction(typeDef.parseValue) ||
        _.isFunction(typeDef.parseLiteral)
      ) {
        typeDef.type = NamedType.SCALAR;
      } else {
        this.emit(EventType.WARN, 'type ' + typeName +
        ' has no object type specified. This will throw an ' +
        'error during build');
      }
    }

    switch (typeDef.type) {
      case NamedType.OBJECT:
      case NamedType.INTERFACE:
        forEach(typeDef.fields, (fieldDef, fieldName) => {
          fixField.call(this, typeDef.fields, fieldName);
        }, true);
        break;
      case NamedType.ENUM:
        forEach(typeDef.values, (valueDef, valueName) => {
          fixValue.call(this, typeDef.values, valueName);
        });
        break;
      default:
        break;
    }
  }, true);
}

/**
 * Fixes shorthand on directive args
 * @param {*} directives 
 */
export function fixDirectives(directives) {
  forEach(directives, dirDef => {
    forEach(dirDef.args, (argDef, argName) => {
      fixArg.call(this, dirDef.args, argName);
    }, true);
  }, true);
}

/**
 * Fix shorthand notations and fill in missing
 * configuration when possible in the definition
 */
export function fixDefinition() {
  fixDirectives.call(this, this._directives);
  fixTypes.call(this, this._types);
  return this;
}
