import { map } from './map';

export function promiseMap(collection, mapper) {
  return Promise.all(
    map(
      collection,
      (item, index) => mapper(item, index, collection),
      true,
    ),
  );
}
