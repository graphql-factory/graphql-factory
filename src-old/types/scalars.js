import { GraphQLError, Kind } from 'graphql';
/*
 * Ports from 
 * https://github.com/taion/graphql-type-json
 * https://github.com/soundtrackyourbrand/graphql-custom-datetype
 */
function coerceDate(value) {
  if (!(value instanceof Date)) {
    // Is this how you raise a 'field error'?
    throw new Error('Field error: value is not an instance of Date');
  }
  if (isNaN(value.getTime())) {
    throw new Error('Field error: value is an invalid Date');
  }
  return value.toJSON();
}

function parseLiteral(ast) {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT: {
      return ast.fields.reduce((value, field) => {
        value[field.name.value] = parseLiteral(field.value);
        return value;
      }, Object.create(null));
    }
    case Kind.LIST:
      return ast.values.map(parseLiteral);
    default:
      return null;
  }
}

export const JSONType = {
  type: 'Scalar',
  description:
    'The `JSON` scalar type represents JSON values as ' +
    'specified by [ECMA-404](http://www.ecma-international.org/' +
    'publications/files/ECMA-ST/ECMA-404.pdf).',
  serialize: value => value,
  parseValue: value => value,
  parseLiteral,
};

export const DateTimeType = {
  type: 'Scalar',
  description: 'Represents a Date object',
  serialize: coerceDate,
  parseValue: coerceDate,
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        'Query error: Can only parse strings ' +
          'to dates but got a: ' +
          ast.kind,
        [ast],
      );
    }
    const result = new Date(ast.value);
    if (isNaN(result.getTime())) {
      throw new GraphQLError('Query error: Invalid date', [ast]);
    }
    if (ast.value !== result.toJSON()) {
      throw new GraphQLError(
        'Query error: Invalid date format, ' +
          'only accepts: YYYY-MM-DDTHH:MM:SS.SSSZ',
        [ast],
      );
    }
    return result;
  },
};
