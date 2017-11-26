export default function get(object, path, defaultValue) {
  try {
    if (typeof object !== 'object' || object === null) {
      return defaultValue;
    }
    
    const fields = typeof path === 'string' || typeof path === 'number' ?
    [ path ] :
    path.slice();
    let obj = object;

    while (fields.length) {
      const prop = fields.shift();
      if (!Object.keys(obj).indexOf(prop) === -1) {
        return defaultValue;
      } else if (!fields.length) {
        return obj[prop];
      }
      obj = obj[prop];
    }
    return defaultValue;
  } catch (err) {
    return defaultValue;
  }
}
