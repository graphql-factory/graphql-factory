/**
 * Implements a lodash-style reduce
 * @param {*} collection 
 * @param {*} reducer 
 * @param {*} initialValue 
 */
export function reduce(collection, reducer, initialValue, throwError) {
  let error = null;
  const isArray = Array.isArray(collection);

  const result = Object.keys(collection).reduce((accum, key) => {
    try {
      if (error) {
        return;
      }
      const k = isArray ? Number(key) : String(key);
      const value = collection[k];
      return reducer(accum, value, key, collection);
    } catch (err) {
      error = err;
    }
  }, initialValue);

  if (throwError && error) {
    throw error;
  }
  return result;
}
