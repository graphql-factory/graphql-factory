export function stringMatch(str, match) {
  if (typeof str !== 'string' || match === undefined) {
    return false;
  }
  if (match === true) {
    return Boolean(str);
  }
  if (match === false) {
    return str === '';
  }
  return str.match(match) !== null;
}
