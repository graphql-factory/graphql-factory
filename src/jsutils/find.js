import { forEach } from './forEach';
export function find(collection, finder, throwErrors = false) {
  let result;
  forEach(collection, (value, key) => {
    if (finder(value, key, collection)) {
      result = value;
      return false;
    }
  }, throwErrors);
  return result;
}
