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
  deconstructDirective
} from './utilities/deconstruct.js';
export {
  request
} from './request';
