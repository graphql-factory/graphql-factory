import { reduce } from './reduce';
import { isPromise } from './isPromise';

export function promiseReduce(collection, iteratee, initialValue) {
  return reduce(
    collection,
    (previous, value, key) => {
      return isPromise(previous)
        ? previous.then(resolved => iteratee(resolved, value, key))
        : iteratee(previous, value, key);
    },
    initialValue,
  );
}
