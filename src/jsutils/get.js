export default function get(object, path, defaultValue) {
  try {
    if (!path) {
      return defaultValue;
    }
    const p = Array.isArray(path) ? path : [ path ];
    if (!p.length) {
      return defaultValue;
    }
    let obj = object;
    let key = null;
    while (p.length) {
      key = p.shift();
      obj = obj[key];
    }
    return obj;
  } catch (err) {
    return defaultValue;
  }
}
