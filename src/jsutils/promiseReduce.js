import { reduce } from './reduce';
/**
 * Implements reduce on an iterable of promise/non-promise objects
 * @param iterable
 * @param reducer
 * @param initialValue
 * @returns {*}
 * 
 * Do not use flow here
 */
export default function promiseReduce(iterable, reducer, initialValue) {
  return reduce(iterable, (previousPromise, currentPromise, count) => {
    return Promise.resolve(previousPromise).then(result => {
      return Promise.resolve(currentPromise).then(current => {
        return reducer(result, current, count, iterable);
      });
    });
  }, Promise.resolve(initialValue), true);
}
