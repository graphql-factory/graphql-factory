/**
 * Implements a custom lodash-like forEach with additional
 * option to throw errors
 * @param {*} collection 
 * @param {*} iteratee 
 * @param {*} throwErrors 
 */

export function forEach(collection, iteratee, throwErrors) {
  let error = null;
  const isArray = Array.isArray(collection);

  Object.keys(collection).some(key => {
    try {
      const k = isArray ? Number(key) : String(key);
      const value = collection[k];
      return iteratee(value, key, collection) === false;
    } catch (err) {
      error = err;
      return true;
    }
  });
  if (throwErrors && error) {
    throw error;
  }
}
