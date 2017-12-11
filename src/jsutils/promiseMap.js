import { map } from './map';

export function promiseMap(collection, mapper) {
  return Promise.all(
    map(collection, (item, index) => {
      try {
        return Promise.resolve(mapper(item, index, collection));
      } catch (err) {
        return Promise.reject(err);
      }
    }, true)
  );
}
