// @flow
import { GraphQLError } from 'graphql';

declare class SchemaBackingError extends Error {
  constructor(message: string): void;
  message: string;
}

export function SchemaBackingError(message: string) {
  Object.defineProperties(this, {
    message: {
      value: message,
      enumerable: true,
      writable: true
    }
  });
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, SchemaBackingError);
  } else {
    Object.defineProperty(this, 'stack', {
      value: Error().stack,
      writable: true,
      configurable: true,
    });
  }
}

(SchemaBackingError: any).prototype = Object.create(Error.prototype, {
  constructor: { value: SchemaBackingError },
  name: { value: 'SchemaBackingError' },
  toString: {
    value: function toString() {
      return this.message;
    },
  },
});

declare class SchemaDefinitionError extends Error {
  constructor(message: string): void;
  message: string;
}

export function SchemaDefinitionError(message: string) {
  Object.defineProperties(this, {
    message: {
      value: message,
      enumerable: true,
      writable: true
    }
  });
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, SchemaDefinitionError);
  } else {
    Object.defineProperty(this, 'stack', {
      value: Error().stack,
      writable: true,
      configurable: true,
    });
  }
}

(SchemaDefinitionError: any).prototype = Object.create(Error.prototype, {
  constructor: { value: SchemaDefinitionError },
  name: { value: 'SchemaDefinitionError' },
  toString: {
    value: function toString() {
      return this.message;
    },
  },
});

export default {
  backing: SchemaBackingError,
  definition: SchemaDefinitionError,
  graphql: GraphQLError
};
