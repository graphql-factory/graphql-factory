import * as _ from './lodash.custom';
import isPromise from './isPromise';

/**
 * Performs a map operation on a collection and catches
 * any errors. Then throws any encountered error and
 * resolves any any promises that were mapped. If no
 * promises were mapped then return the value map
 * @param {*} obj 
 * @param {*} iteratee 
 */
export function mapMaybePromise(collection, iteratee) {
  let mapError = null;
  let hasPromise = false;
  const _iteratee = _.isFunction(iteratee) ? iteratee : _.identity;
  const valueMap = _.map(collection, (value, keyOrIndex) => {
    if (mapErr) {
      return null;
    }
    try {
      const result = _iteratee(value, keyOrIndex, collection);
      hasPromise = hasPromise || isPromise(result);
      return result;
    } catch(err) {
      mapError = err;
    }
  });

  if (mapError) {
    throw mapError;
  }

  return hasPromise ? Promise.all(valueMap) : valueMap;
}