import { hasOwn } from './hasOwn';

/**
 * An extended isArray function.
 * If a single argument is passed check if that argument is an array
 * If 2 arguments are passed check that the first is an object that
 * has the key specified by the second argument and that the value
 * at that key is an array
 * if a third argument is passed then check that the array has at least
 * that many elements
 * @param {*} args
 */
export function isArray(...args) {
  const [arrayOrObject, keyOrMinimum, minimum] = args;
  if (!args.length) {
    return false;
  } else if (args.length === 1) {
    return Array.isArray(arrayOrObject);
  } else if (typeof keyOrMinimum === 'number') {
    return Array.isArray(arrayOrObject) && arrayOrObject.length >= keyOrMinimum;
  }

  const foundArray =
    hasOwn(arrayOrObject, keyOrMinimum) &&
    Array.isArray(arrayOrObject[keyOrMinimum]);

  return typeof minimum === 'number'
    ? foundArray && arrayOrObject[keyOrMinimum].length >= minimum
    : foundArray;
}
