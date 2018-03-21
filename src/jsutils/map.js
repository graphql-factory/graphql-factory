export function map(collection, iteratee, throwErrors) {
  let error = null;
  const mapper = (value, key) => {
    try {
      return error && throwErrors
        ? undefined
        : iteratee(value, key, collection);
    } catch (err) {
      error = err;
    }
  };
  const result = Array.isArray(collection)
    ? collection.map(mapper)
    : collection && typeof collection === 'object'
      ? Object.keys(collection).map(key => {
          return mapper(collection[key], key);
        })
      : [];
  if (error && throwErrors) {
    throw error;
  }
  return result;
}
