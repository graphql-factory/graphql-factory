/**
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="es" include="assign,capitalize,castArray,filter,find,forEach,get,has,identity,includes,intersection,isArray,isFunction,isNumber,isObject,isString,keys,map,noop,omit,reduce,set,union,uniq,values,without" -o src/common/lodash`
 * Copyright JS Foundation and other contributors <https://js.foundation/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
import toString from './toString.js';
import upperFirst from './upperFirst.js';

/**
 * Converts the first character of `string` to upper case and the remaining
 * to lower case.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to capitalize.
 * @returns {string} Returns the capitalized string.
 * @example
 *
 * _.capitalize('FRED');
 * // => 'Fred'
 */
function capitalize(string) {
  return upperFirst(toString(string).toLowerCase());
}

export default capitalize;
