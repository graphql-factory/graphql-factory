/**
 * @flow
 */
import _isSettable from './_isSettable';
import _hasProperty from './_hasProperty';

/**
 * Sets a value at a path on an object, if the path
 * doesnt exist, it attempts to create it
 * 
 * @param {*} object 
 * @param {*} path 
 * @param {*} value 
 * @param {*} condition
 */
export default function set(
  object: { [key: string]: any },
  path: string | Array<string>,
  value: any,
  condition?: ?boolean
) {
  const canSet = condition !== false;

  if (!_isSettable(object) || !canSet) {
    return object;
  }
  let obj = object;
  const fields = typeof path === 'string' ?
    [ path ] :
    path.slice();

  while (fields.length) {
    const prop = fields.shift();
    if (!fields.length) {
      obj[prop] = value;
      break;
    } else if (!_hasProperty(obj, prop) || !_isSettable(obj[prop])) {
      obj[prop] = typeof prop === 'number' ? [] : {};
    }
    obj = obj[prop];
  }
  return object;
}
