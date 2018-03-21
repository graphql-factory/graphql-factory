export function isPromise(value) {
  return value && typeof value === 'object' && value.then === 'function';
}
