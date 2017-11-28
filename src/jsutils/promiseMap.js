export function promiseMap(collection, mapper) {
  return Promise.all(
    collection.map((item, index) => {
      try {
        return Promise.resolve(mapper(item, index, collection));
      } catch (err) {
        return Promise.reject(err);
      }
    })
  );
}
