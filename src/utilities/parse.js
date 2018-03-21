import { print, parse } from 'graphql';
import { printSchemaWithDirectives } from './print';

export function printAndParse(nodes) {
  return parse(print(nodes));
}

export function parseSchemaIntoAST(schema) {
  return parse(printSchemaWithDirectives(schema));
}
