import { print, isSpecifiedScalarType, isSpecifiedDirective } from 'graphql';

export function printSchemaWithDirectives(schema) {
  const str = Object.keys(schema.getTypeMap())
    .filter(k => !k.match(/^__/))
    .reduce((accum, name) => {
      const type = schema.getType(name);
      return !isSpecifiedScalarType(type)
        ? accum + `${print(type.astNode)}\n`
        : accum;
    }, '');

  return schema.getDirectives().reduce((accum, d) => {
    return !isSpecifiedDirective(d) ? accum + `${print(d.astNode)}\n` : accum;
  }, str + `${print(schema.astNode)}\n`);
}
