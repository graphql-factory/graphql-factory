export function hasOwn(object, prop) {
  return (
    object &&
    typeof object === 'object' &&
    Object.prototype.hasOwnProperty.call(object, prop)
  );
}
