export function forEach(collection, iteratee) {
  return Array.isArray(collection)
    ? collection.forEach(iteratee)
    : collection && typeof collection === 'object'
      ? Object.keys(collection).forEach(key => {
          return iteratee(collection[key], key);
        })
      : undefined;
}
