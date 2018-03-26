// @flow
import { lodash as _, asrt, isObject } from '../../jsutils';
import { SchemaBacking } from './SchemaBacking';

/**
 * Sets a function at a specific path if its actually a function
 * @param {*} obj
 * @param {*} path
 * @param {*} fn
 */
export function setFn(obj: any, path: any, fn: any) {
  if (typeof fn === 'function') {
    _.set(obj, path, fn);
  }
}

/**
 * Assert errors as backing errors
 * @param {*} condition
 * @param {*} message
 */
export function assert(condition: boolean, message: string) {
  asrt('backing', condition, message);
  return true;
}

export function assertType(backing: SchemaBacking, name: string, type: string) {
  const config = _.get(backing, ['types', name]) || {};
  asrt(
    'backing',
    !config.type || config.type === type,
    'Expected ' + name + ' to be of type ' + type + ' but got ' + config.type,
  );
}

/**
 * Assert a function
 * @param {*} fn
 * @param {*} name
 */
export function assertFn(fn: any, name: string) {
  return fn
    ? assert(typeof fn === 'function', `${name} must be a function`)
    : false;
}

/**
 * Assert an object
 * @param {*} obj
 * @param {*} name
 */
export function assertObj(obj: any, name: string) {
  return obj ? assert(isObject(obj), `${name} must be an object`) : false;
}
