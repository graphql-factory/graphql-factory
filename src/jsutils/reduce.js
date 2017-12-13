/**
 * Implements a lodash-style reduce
 * @param {*} collection 
 * @param {*} reducer 
 * @param {*} initialValue 
 */
import * as _ from './lodash.custom';

export function reduce(collection, reducer, initialValue, throwError) {
  let error = null;

  const fn = (accum, value, key, coll) => {
    try {
      return error ? accum : reducer(accum, value, key, coll);
    } catch (err) {
      error = err;
    }
  };

  const result = initialValue ?
    _.reduce(collection, fn, initialValue) :
    _.reduce(collection, fn);

  if (throwError && error instanceof Error) {
    throw error;
  }
  return result;
}
