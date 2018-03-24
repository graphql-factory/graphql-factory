export function reduce(collection, iteratee, initialValue, throwErrors) {
  let error = null;
  const reducer = (accum, value, key) => {
    try {
      return error && throwErrors
        ? undefined
        : iteratee(accum, value, key, collection);
    } catch (err) {
      error = err;
    }
  };
  const result = Array.isArray(collection)
    ? collection.reduce(reducer, initialValue)
    : collection && typeof collection === 'object'
      ? Object.keys(collection).reduce((accum, key) => {
          return reducer(accum, collection[key], key);
        }, initialValue)
      : undefined || initialValue;
  if (error && throwErrors) {
    throw error;
  }
  return result;
}
