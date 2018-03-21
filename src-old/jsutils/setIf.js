import { set } from './lodash.custom';

export function setIf(obj, path, value, condition) {
  if (condition) {
    return set(obj, path, value);
  }
}
