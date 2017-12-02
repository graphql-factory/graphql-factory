export function omit(obj, ...keys) {
  return Object.keys(obj).reduce((result, key) => {
    if (keys.indexOf(key) === -1) {
      result[key] = obj[key];
    }
    return result;
  }, Object.create(null));
}
