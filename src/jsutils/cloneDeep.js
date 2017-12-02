import { isObject } from './assertions';

export default function cloneDeep(object) {
  try {
    if (!isObject(object)) {
      return object;
    }

    const clone = object.constructor ?
      new object.constructor() :
      Array.isArray(object) ? [] : Object.create(null);

    return Object.keys(object).reduce((c, key) => {
      c[key] = cloneDeep(object[key]);
      return c;
    }, clone);
  } catch (err) {
    throw err;
  }
}
