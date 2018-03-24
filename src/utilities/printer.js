/**
 * Prints a SchemaDefinition in Schema Language format
 * @flow
 */
import type { ObjMap } from 'graphql/jsutils/ObjMap';
import { SchemaDefinition } from '../definition';
import {
  isObject,
  map,
  reduce,
  indent,
  stringMatch,
  lodash as _,
} from '../jsutils';
import { castAppliedDirectiveList } from '../utilities';

const LITERAL_RX = /^```([\w]+)```$/;

/**
 * Adds description comments
 * @param {*} description
 * @param {*} describes
 * @param {*} tabs
 * @param {*} splitAt
 */
export function withDescription(
  description: string,
  describes: string,
  tabs: number = 0,
  splitAt: number = 80,
) {
  if (stringMatch(description, true)) {
    const prefix = indent(tabs) + '# ';
    const end = splitAt - prefix.length;
    const rx = new RegExp('.{1,' + end + '}', 'g');
    const comments = description.replace(/(\r\n|\n|\r)/gm, ' ').match(rx) || [];
    return comments.map(c => `${prefix}${c}`).join('\n') + `\n${describes}`;
  }
  return describes;
}

/**
 * Coerces a js type to a string and returns the type name
 * @param {*} obj
 */
export function getType(obj: any) {
  if (Array.isArray(obj)) {
    return ['array', obj];
  } else if (obj === 'undefined') {
    return ['undefined', 'undefined'];
  } else if (obj === null) {
    return ['null', 'null'];
  } else if (typeof obj === 'string') {
    // check for literal string which will be unquoted and
    // have the literal markers removed
    if (obj.match(LITERAL_RX)) {
      return ['literal', obj.replace(LITERAL_RX, '$1')];
    }
    const str = obj.replace(/"/g, '\\"');

    return ['string', `"${str}"`];
  } else if (typeof obj === 'number') {
    return String(obj).indexOf('.') !== -1
      ? ['float', String(obj)]
      : ['int', String(obj)];
  } else if (typeof obj === 'boolean') {
    return ['boolean', String(obj)];
  } else if (obj instanceof Date) {
    return ['date', JSON.stringify(obj)];
  }
  return [typeof obj, obj];
}

/**
 * Converts args to
 * @param obj
 * @param replaceBraces
 * @returns {undefined}
 */
export function toArgs(obj: any, replaceBraces: boolean = false) {
  const [type, value] = getType(obj);
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
  result = result || '';
  return replaceBraces ? result.replace(/^[{[]([\S\s]+)[}\]]$/, '$1') : result;
}

/**
 * Prints the directive values with their arguments
 * @param {*} definition
 * @param {*} reason
 */
export function printDirectives(directives?: ?ObjMap<any>, reason?: ?string) {
  if (directives) {
    // ensure dirs are represented as an array
    // of directive configs
    const dirs = castAppliedDirectiveList(directives);

    // add deprecated is reason supplied
    if (typeof reason === 'string' && !_.find(dirs, { name: 'deprecated' })) {
      dirs.push({ name: 'deprecated', args: { reason } });
    }

    return dirs.length
      ? reduce(
          dirs,
          (accum, d) => {
            const name = _.get(d, 'name');
            const args = _.get(d, 'args');

            if (name && typeof name === 'string' && args !== false) {
              const value =
                isObject(args) && Object.keys(args).length
                  ? ` @${name}(${toArgs(args, true)})`
                  : ` @${name}`;
              accum.push(value);
            }
            return accum;
          },
          [],
        ).join('')
      : '';
  }
  return '';
}

/**
 * Prints args
 * @param {*} args
 * @param {*} tabs
 * @param {*} parenthesis
 */
export function printArguments(
  args: ObjMap<any>,
  tabs: number = 2,
  parenthesis: boolean = true,
) {
  if (isObject(args) && Object.keys(args).length) {
    const a = map(
      args,
      (arg, name) => {
        const { type, defaultValue, description } = arg;
        const dirs = printDirectives(arg['@directives']);
        const defVal =
          defaultValue !== undefined ? ` = ${toArgs(defaultValue)}` : '';
        return withDescription(
          description,
          `${indent(tabs)}${name}: ${type}${defVal}${dirs}`,
          tabs,
        );
      },
      true,
    ).join(',\n');
    return parenthesis ? `(\n${a}\n${indent(tabs - 1)})` : a;
  }
  return '';
}

/**
 * Prints object fields
 * @param {*} fields
 * @param {*} parent
 * @param {*} tabs
 */
export function printFields(fields: ObjMap<any>, tabs: number = 1) {
  return map(
    fields,
    (field, name) => {
      const { description, type, args, deprecationReason } = field;
      const dirs = printDirectives(field['@directives'], deprecationReason);
      const argStr = printArguments(args);
      return withDescription(
        description,
        `${indent(tabs)}${name}${argStr}: ${type}${dirs}`,
        tabs,
      );
    },
    true,
  ).join('\n');
}

/**
 * Print an object
 * @param {*} definition
 * @param {*} name
 */
export function printObject(definition: ObjMap<any>, name: string) {
  const { description, interfaces, fields } = definition;
  const fieldStr = printFields(fields);
  const dirs = printDirectives(definition['@directives']);
  const iface =
    Array.isArray(interfaces) && interfaces.length
      ? 'implements' + interfaces.join(' & ')
      : '';
  return withDescription(
    description,
    `type ${name}${iface}${dirs} {\n${fieldStr}\n}\n`,
  );
}

/**
 * Prints a scalar value
 * @param {*} definition
 * @param {*} name
 */
export function printScalar(definition: ObjMap<any>, name: string) {
  const { description } = definition;
  const dirs = printDirectives(definition['@directives']);
  return withDescription(description, `scalar ${name}${dirs}\n`);
}

/**
 * Prints enum values
 * @param {*} values
 */
export function printValues(values: ObjMap<any>) {
  return map(values, (value, name) => {
    const { description, deprecationReason } = value;
    const directives = (value['@directives'] = value['@directives'] || {});
    // special case enum directive added to support setting values
    // that are different from the value name
    if (!directives.enum) {
      directives.enum = {
        value: value.value,
      };
    }
    const dirs = printDirectives(directives, deprecationReason);
    return withDescription(description, `  ${name}${dirs}`, 1);
  }).join('\n');
}

/**
 * Prints an enum
 * @param {*} definition
 * @param {*} name
 */
export function printEnum(definition: ObjMap<any>, name: string) {
  const { values, description } = definition;
  const dirs = printDirectives(definition['@directives']);
  const vals = printValues(values);
  return withDescription(description, `enum ${name}${dirs} {\n${vals}\n}\n`);
}

/**
 * Prints an input type
 * @param {*} definition
 * @param {*} name
 */
export function printInput(definition: ObjMap<any>, name: string) {
  const { fields, description } = definition;
  const dirs = printDirectives(definition['@directives']);
  const fieldStr = printArguments(fields, 1, false);
  return withDescription(
    description,
    `input ${name}${dirs} {\n${fieldStr}\n}\n`,
  );
}

/**
 * Prints a union type
 * @param {*} definition
 * @param {*} name
 */
export function printUnion(definition: ObjMap<any>, name: string) {
  const { types, description } = definition;
  const typeStr = Array.isArray(types) && types.length ? types.join(' | ') : '';
  const dirs = printDirectives(definition['@directives']);
  return withDescription(description, `union ${name}${dirs} = ${typeStr}\n`);
}

/**
 * Prints an interface type
 * @param {*} definition
 * @param {*} name
 */
export function printInterface(definition: ObjMap<any>, name: string) {
  const { description, fields } = definition;
  const fieldStr = printFields(fields);
  const dirs = printDirectives(definition['@directives']);
  return withDescription(
    description,
    `interface ${name}${dirs} {\n${fieldStr}\n}\n`,
  );
}
/**
 * Routes the printer to the correct type
 * @param {*} definition
 * @param {*} name
 */
export function printType(definition: ObjMap<any>, name: string) {
  if (!definition.type) {
    throw new Error(`Failed to print "${name}", missing "type" field`);
  }
  switch (definition.type) {
    case 'Object':
      return printObject(definition, name);
    case 'Scalar':
      return printScalar(definition, name);
    case 'Enum':
      return printEnum(definition, name);
    case 'Input':
      return printInput(definition, name);
    case 'Union':
      return printUnion(definition, name);
    case 'Interface':
      return printInterface(definition, name);
    default:
      throw new Error('the type cannot be printed');
  }
}

/**
 * Prints a directive value
 * @param {*} definition
 * @param {*} name
 */
export function printDirective(definition: ObjMap<any>, name: string) {
  const { description, locations, args } = definition;
  const argStr = printArguments(args, 1);
  const locStr = locations.join(' | ');
  return withDescription(
    description,
    `directive @${name}${argStr} on ${locStr}\n`,
  );
}

/**
 * Prints the schema
 * @param {*} definition
 */
export function printSchema(definition: ObjMap<any>) {
  const { query, mutation, subscription } = definition;
  const dirs = printDirectives(definition['@directives']);
  const opStr = reduce(
    { query, mutation, subscription },
    (o, value, name) => {
      if (stringMatch(value, true)) {
        o.push(`  ${name}: ${value}`);
      }
      return o;
    },
    [],
    true,
  ).join('\n');
  return `schema${dirs} {\n${opStr}\n}\n`;
}

/**
 * Print a Schema language definition
 * @param {*} definition
 */
export function printDefinition(definition: SchemaDefinition) {
  const { schema, types, directives } = definition;

  // print each part of the definition and return a joined string
  return map(types, printType, true)
    .concat(map(directives, printDirective, true))
    .concat(printSchema(schema || {}))
    .join('\n');
}
