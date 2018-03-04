/**
 * Implements a lodash-style reduce
 * @param {*} collection
 * @param {*} mapper
 * @param {*} throwError
 */
import * as _ from './lodash.custom';

export function map(collection, mapper, throwError) {
  let error = null;

  const fn = (value, key, coll) => {
    try {
      return error && throwError ? undefined : mapper(value, key, coll);
    } catch (err) {
      error = err;
    }
  };

  const result = _.map(collection, fn);

  if (throwError && error instanceof Error) {
    throw error;
  }
  return result;
}
