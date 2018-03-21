export function filterKeys(object, allowed) {
  return Object.keys(object).filter(key => {
    return allowed.indexOf(key) === -1;
  });
}
