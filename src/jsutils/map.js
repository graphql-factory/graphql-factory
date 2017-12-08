/**
 * Implements a lodash-style reduce
 * @param {*} collection 
 * @param {*} mapper
 * @param {*} throwError 
 */
export function map(collection, mapper, throwError) {
  if (typeof collection !== 'object' || collection === null) {
    return [];
  }
  let error = null;
  const isArray = Array.isArray(collection);
  const result = Object.keys(collection).map(key => {
    try {
      const k = isArray ? Number(key) : String(key);
      const value = collection[k];
      return mapper(value, key, collection);
    } catch (err) {
      error = err;
    }
  });

  if (throwError && error) {
    throw error;
  }
  return result;
}
