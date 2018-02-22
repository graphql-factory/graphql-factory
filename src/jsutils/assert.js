/**
 * @flow
 */
import { GraphQLError } from 'graphql';
import { SchemaBackingError, SchemaDefinitionError } from './errors';

export function assert(
  condition: boolean,
  message: string,
  location: any
) {
  if (!condition) {
    const msg = typeof message === 'string' ?
      message :
      'AssertionError';
    throw new GraphQLError(msg, location);
  }
}

export function asrt(
  type: string,
  condition: boolean,
  message: string,
  ...metadata: Array<any>
) {
  if (!condition) {
    switch (type) {
      case 'backing':
        throw new SchemaBackingError(message);
      case 'definition':
        throw new SchemaDefinitionError(message);
      default:
        throw new Error(message);
    }
  }
}
