/**
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="es" include="assign,castArray,toPath,reduce,map,mapKeys,values,keys,get,set,clone,cloneDeep,merge,filter,forEach,noop,union,intersection,includes,find,isEmpty,isObject,isObjectLike,isPlainObject,isFunction,isNumber,isArray,isString,pick,pickBy,omit,omitBy,some,has" -o src/jsutils/lodash`
 * Copyright JS Foundation and other contributors <https://js.foundation/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
import baseHas from './_baseHas.js';
import hasPath from './_hasPath.js';

/**
 * Checks if `path` is a direct property of `object`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = { 'a': { 'b': 2 } };
 * var other = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.has(object, 'a');
 * // => true
 *
 * _.has(object, 'a.b');
 * // => true
 *
 * _.has(object, ['a', 'b']);
 * // => true
 *
 * _.has(other, 'a');
 * // => false
 */
function has(object, path) {
  return object != null && hasPath(object, path, baseHas);
}

export default has;
