import { isObject } from './assertions';

export default function cloneDeep(object) {
  if (!isObject(object)) {
    return object;
  }
  const clone = new object.constructor();

  return Object.keys(object).reduce((c, key) => {
    c[key] = cloneDeep(object[key]);
    return c;
  }, clone);
}
