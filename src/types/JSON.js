import { Kind } from 'graphql'
/*
 * Ported type from https://github.com/taion/graphql-type-json
 */

function parseLiteral (ast) {
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

export default {
  type: 'Scalar',
  description: 'The `JSON` scalar type represents JSON values as specified by '
  + '[ECMA-404](http://www.ecma-international.org/ publications/files/ECMA-ST/ECMA-404.pdf).',
  serialize: value => value,
  parseValue: value => value,
  parseLiteral
}
