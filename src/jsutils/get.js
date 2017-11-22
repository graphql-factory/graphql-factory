import _hasProperty from './_hasProperty';

export default function get(object, path, defaultValue) {
  const fields = typeof path === 'string' || typeof path === 'number' ?
    [ path ] :
    path.slice();
  let obj = object;

  while (fields.length) {
    const prop = fields.shift();

    if (!_hasProperty(obj, prop)) {
      return defaultValue;
    } else if (!fields.length) {
      return obj[prop];
    }
    obj = obj[prop];
  }

  return defaultValue;
}
