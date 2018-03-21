/**
 * Implements a custom lodash-like forEach with additional
 * option to throw errors
 * @param {*} collection
 * @param {*} iteratee
 * @param {*} throwErrors
 */
import * as _ from './lodash.custom';

export function forEach(collection, iteratee, throwError) {
  let error = null;

  const fn = (value, key, coll) => {
    try {
      return error && throwError ? false : iteratee(value, key, coll);
    } catch (err) {
      error = err;
    }
  };

  const result = _.forEach(collection, fn);

  if (throwError && error) {
    throw error;
  }
  return result;
}
