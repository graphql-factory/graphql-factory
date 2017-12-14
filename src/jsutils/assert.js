/**
 * @flow
 */
import { GraphQLError } from 'graphql';
import errors from './errors';

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
    const CustomError = errors[type];
    if (CustomError) {
      throw new CustomError(message, ...metadata);
    }
    throw new Error(message);
  }
}
