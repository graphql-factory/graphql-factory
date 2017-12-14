import { GraphQLError } from 'graphql';

export class SchemaBackingError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class SchemaDefinitionError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default {
  backing: SchemaBackingError,
  definition: SchemaDefinitionError,
  graphql: GraphQLError
};
