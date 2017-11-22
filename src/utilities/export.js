import {
  SchemaBacking,
  SchemaDefinition,
} from '../types';
import {
  map,
  reduce,
  indent,
  isObject
} from '../jsutils';
import type {
  SchemaDefinitionConfig
} from '../types/definition';

const LITERAL_RX = /^```([\w]+)```$/;

/**
 * Coerces a js type to a string and returns the type name
 * @param {*} obj 
 */
export function getType(obj) {
  if (Array.isArray(obj)) {
    return [ 'array', obj ];
  } else if (obj === 'undefined') {
    return [ 'undefined', 'undefined' ];
  } else if (obj === null) {
    return [ 'null', 'null' ];
  } else if (typeof obj === 'string') {
    // check for literal string which will be unquoted and
    // have the literal markers removed
    if (obj.match(LITERAL_RX)) {
      return [ 'literal', obj.replace(LITERAL_RX, '$1') ];
    }
    return [ 'string', `"${obj}"` ];
  } else if (typeof obj === 'number') {
    return String(obj).indexOf('.') !== -1 ?
      [ 'float', String(obj) ] :
      [ 'int', String(obj) ];
  } else if (typeof obj === 'boolean') {
    return [ 'boolean', String(obj) ];
  } else if (obj instanceof Date) {
    return [ 'date', JSON.stringify(obj) ];
  }
  return [ typeof obj, obj ];
}

/**
 * Converts args to
 * @param obj
 * @param replaceBraces
 * @returns {undefined}
 */
export function toArgs(obj, replaceBraces = false) {
  const [ type, value ] = getType(obj);
  let result;
  switch (type) {
    case 'undefined':
      break;
    case 'array':
      result = `[${map(value, v => toArgs(v)).join(', ')}]`;
      break;
    case 'object':
      result = `{${map(value, (v, k) => `${k}: ${toArgs(v)}`).join(', ')}}`;
      break;
    default:
      result = value;
      break;
  }
  return replaceBraces ?
    result.replace(/^[{[]([\S\s]+)[}\]]$/, '$1') :
    result;
}

/**
 * Prints the directive values with their arguments
 * @param {*} definition 
 * @param {*} reason 
 */
export function printTypeDirectives(directives, reason) {
  const directiveMap = isObject(directives) ?
    Object.assign({}, directives) :
    {};
  if (typeof reason === 'string') {
    directiveMap.deprecated = { reason };
  }

  if (!Object.keys(directiveMap).length) {
    return '';
  }
  return ' ' + map(directiveMap, (value, name) => {
    return !isObject(value) ?
      `@${name}` :
      `@${name}(${toArgs(value, true)})`;
  }).join(' ');
}

/**
 * Formats an argument definition
 * @param {*} args 
 * @param {*} tabs 
 */
export function printArguments(args, tabs = 2, paren = true) {
  if (!args || !Object.keys(args).length) {
    return '';
  }
  const _args = map(args, (arg, name) => {
    const definition = isObject(arg) ? arg : { type: arg };
    const { type, defaultValue, description, directives } = definition;
    const dirStr = directives ? printTypeDirectives(directives) : '';
    const dValue = defaultValue === undefined ?
    '' :
    ` = ${toArgs(defaultValue)}`;
    const _arg = `${indent(tabs)}${name}: ${type}${dValue}${dirStr}`;
    return typeof description === 'string' && description !== '' ?
      `${indent(tabs)}# ${description}\n${_arg}` :
      _arg;
  }).join(',\n');

  return paren ?
    `(\n${_args}\n${indent(tabs - 1)})` :
    _args;
}

/**
 * Prints object fields
 * @param {*} fields 
 * @param {*} parent 
 * @param {*} backing 
 * @param {*} tabs 
 */
export function printFields(fields, parent, backing, tabs = 1) {
  return map(fields, (field, name) => {
    const {
      description,
      type,
      args,
      resolve,
      deprecationReason,
      directives
    } = field;

    const dirStr = directives ?
      printTypeDirectives(directives, deprecationReason) :
      '';
    const argStr = args ? printArguments(args) : '';

    // register the resolve
    if (typeof resolve === 'function') {
      backing.Object(parent).resolve(name, resolve);
    }

    // construct the field
    const fieldStr = `${indent(tabs)}${name}${argStr}: ${type}${dirStr}`;

    // return the field with optional description
    return typeof description === 'string' && description !== '' ?
      `${indent(tabs)}# ${description}\n${fieldStr}` :
      fieldStr;
  })
  .join('\n');
}

/**
 * Print an object
 * @param {*} definition 
 * @param {*} name 
 * @param {*} backing 
 */
export function printObject(definition, name, backing) {
  const {
    description,
    interfaces,
    fields,
    isTypeOf,
    directives
  } = definition;

  const fieldStr = printFields(fields, name, backing);
  const dirStr = directives ? printTypeDirectives(directives) : '';
  const iface = Array.isArray(interfaces) && interfaces.length ?
    interfaces.join(', ') :
    '';

  // register the isTypeOf function
  if (typeof isTypeOf === 'function') {
    backing.Object(name).isTypeOf(isTypeOf);
  }

  // build the object string
  const objStr = `type ${name}${iface}${dirStr} {\n${fieldStr}\n}\n`;

  // add any descriptions
  return typeof description === 'string' && description !== '' ?
    `# ${description}\n${objStr}` :
    objStr;
}

/**
 * Prints a scalar value
 * @param {*} definition 
 * @param {*} name 
 * @param {*} backing 
 */
export function printScalar(definition, name, backing) {
  const {
    description,
    serialize,
    parseValue,
    parseLiteral,
    directives
  } = definition;

  const dirStr = directives ? printTypeDirectives(directives) : '';

  if (typeof serialize === 'function') {
    backing.Scalar(name).serialize(serialize);
  }
  if (typeof parseValue === 'function') {
    backing.Scalar(name).parseValue(parseValue);
  }
  if (typeof parseLiteral === 'function') {
    backing.Scalar(name).parseLiteral(parseLiteral);
  }

  const scalarStr = `scalar ${name}${dirStr}`;

  return typeof description === 'string' && description !== '' ?
    `# ${description}\n${scalarStr}\n` :
    `${scalarStr}\n`;
}

/**
 * Prints enum values
 * @param {*} values 
 */
export function printValues(values) {
  return map(values, (value, name) => {
    const { description, deprecationReason, directives } = value;
    const dirStr = printTypeDirectives(directives, deprecationReason);
    return typeof description === 'string' && description !== '' ?
      `  # ${description}\n  ${name}${dirStr}` :
      `  ${name}${dirStr}`;
  })
  .join('\n');
}

/**
 * Prints an enum
 * @param {*} definition 
 * @param {*} name 
 * @param {*} backing 
 */
export function printEnum(definition, name) {
  const { values, description, directives } = definition;

  const dirStr = directives ? printTypeDirectives(directives) : '';
  const valStr = printValues(values);
  const enumStr = `enum ${name}${dirStr} {\n${valStr}\n}\n`;

  return typeof description === 'string' && description !== '' ?
    `# ${description}\n${enumStr}` :
    enumStr;
}

/**
 * Prints an input type
 * @param {*} definition 
 * @param {*} name 
 */
export function printInput(definition, name) {
  const { fields, description, directives } = definition;
  const dirStr = directives ? printTypeDirectives(directives) : '';
  const fieldStr = printArguments(fields, 1, false);
  const inputStr = `input ${name}${dirStr} {\n${fieldStr}\n}\n`;
  return typeof description === 'string' && description !== '' ?
    `# ${description}\n${inputStr}` :
    inputStr;
}

/**
 * Prints a union type
 * @param {*} definition 
 * @param {*} name 
 * @param {*} backing 
 */
export function printUnion(definition, name, backing) {
  const { types, resolveType, description, directives } = definition;
  const typeStr = Array.isArray(types) && types.length ?
    types.join(' | ') :
    '';
  const dirStr = directives ? printTypeDirectives(directives) : '';

  if (typeof resolveType === 'function') {
    backing.Union(name).resolveType(resolveType);
  }

  const unionStr = `union ${name}${dirStr} = ${typeStr}\n`;
  return typeof description === 'string' && description !== '' ?
    `# ${description}\n${unionStr}` :
    unionStr;
}

/**
 * Prints an interface type
 * @param {*} definition 
 * @param {*} name 
 * @param {*} backing 
 */
export function printInterface(definition, name, backing) {
  const {
    description,
    fields,
    resolveType,
    directives
  } = definition;

  const fieldStr = printFields(fields, name, backing);
  const dirStr = directives ? printTypeDirectives(directives) : '';

  // register the isTypeOf function
  if (typeof resolveType === 'function') {
    backing.Interface(name).resolveType(resolveType);
  }

  // build the object string
  const ifaceStr = `interface ${name}${dirStr} {\n${fieldStr}\n}\n`;

  // add any descriptions
  return typeof description === 'string' && description !== '' ?
    `# ${description}\n${ifaceStr}` :
    ifaceStr;
}
/**
 * Routes the printer to the correct type
 * @param {*} definition 
 * @param {*} name 
 * @param {*} backing 
 */
export function printType(definition, name, backing) {
  switch (definition.type) {
    case 'Object':
      return printObject(definition, name, backing);
    case 'Scalar':
      return printScalar(definition, name, backing);
    case 'Enum':
      return printEnum(definition, name);
    case 'Input':
      return printInput(definition, name);
    case 'Union':
      return printUnion(definition, name, backing);
    case 'Interface':
      return printInterface(definition, name, backing);
    default:
      throw new Error('the type cannot be printed');
  }
}

/**
 * Prints a directive value
 * @param {*} definition 
 * @param {*} name 
 */
export function printDirective(definition, name, backing) {
  const {
    description,
    locations,
    args,
    resolveRequest,
    resolveResult
  } = definition;
  const argStr = printArguments(args, 1);
  const locStr = locations.join(' | ');
  const directive = `directive @${name}${argStr} on ${locStr}\n`;

  // handle the backing
  if (typeof resolveRequest === 'function') {
    backing.Directive(name).resolveRequest(resolveRequest);
  }
  if (typeof resolveResult === 'function') {
    backing.Directive(name).resolveResult(resolveResult);
  }

  return typeof description === 'string' && description !== '' ?
    `# ${description}\n${directive}` :
    directive;
}

/**
 * Prints the schema
 * @param {*} definition 
 */
export function printSchema(definition) {
  const { directives, query, mutation, subscription } = definition;
  const operations = { query, mutation, subscription };
  const dirStr = directives ?
    printTypeDirectives(directives) :
    '';
  const opStr = reduce(operations, (o, value, name) => {
    if (typeof value === 'string' && value !== '') {
      o.push(`  ${name}: ${value}`);
    }
    return o;
  }, [])
  .join('\n');
  return `schema${dirStr} {\n${opStr}\n}\n`;
}

/**
 * Exports a Schema language definition and 
 * backing from a factory definition
 * @param {*} definition 
 */
export function exportDefinition(
  definition: SchemaDefinition | SchemaDefinitionConfig
) {
  const { schema, types, directives } = definition;
  const backing = new SchemaBacking();

  // map each of the definitions
  const languageDefinition = map(types, (typeDef, typeName) => {
    return printType(typeDef, typeName, backing);
  })
    .concat(
      map(directives, (dirDef, dirName) => {
        return printDirective(dirDef, dirName, backing);
      })
    )
    .concat(
      [ printSchema(schema) ]
    )
    .join('\n');

  // export the language definition and backing
  return {
    definition: languageDefinition,
    backing
  };
}
