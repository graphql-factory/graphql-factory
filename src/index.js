// @flow
import buildSchema from './utilities/buildSchema';

export { SchemaDefinition } from './definition/definition';
export { SchemaBacking } from './backing/backing';
export {
  GraphQLSkipInstruction,
  GraphQLFactoryDirective
} from './types';
export {
  buildSchema
};
export {
  deconstructSchema,
  deconstructDirective,
  deconstructType
} from './utilities/deconstruct.js';
export {
  exportDefinition
} from './utilities/export';
