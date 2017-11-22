// @flow
import buildSchema from './utilities/buildSchema';

export {
  GraphQLSkipInstruction,
  GraphQLFactoryDirective,
  SchemaBacking,
  SchemaDefinition,
  FactoryType
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
export {
  request
} from './request';
