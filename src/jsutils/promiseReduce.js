/**
 * Implements reduce on an iterable of promise/non-promise objects
 * @param iterable
 * @param reducer
 * @param initialValue
 * @returns {*}
 */
export default function promiseReduce(iterable, reducer, initialValue) {
  return iterable.reduce((previousPromise, currentPromise, count) => {
    return Promise.resolve(previousPromise).then(result => {
      return Promise.resolve(currentPromise).then(current => {
        return reducer(result, current, count);
      });
    });
  }, Promise.resolve(initialValue));
}
