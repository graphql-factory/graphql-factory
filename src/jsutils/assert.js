import { GraphQLError } from 'graphql';

export function assert(condition, message, location) {
  if (!condition) {
    const msg = typeof message === 'string' ?
      message :
      'AssertionError';
    throw new GraphQLError(message, location);
  }
}
