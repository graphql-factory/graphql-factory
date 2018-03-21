/**
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="es" include="assign,castArray,toPath,reduce,map,mapKeys,values,keys,get,set,clone,cloneDeep,merge,filter,forEach,noop,union,intersection,includes,find,isEmpty,isObject,isObjectLike,isPlainObject,isFunction,isNumber,isArray,isString,pick,pickBy,omit,omitBy,some,has" -o src/jsutils/lodash`
 * Copyright JS Foundation and other contributors <https://js.foundation/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
import baseIteratee from './_baseIteratee.js';
import negate from './negate.js';
import pickBy from './pickBy.js';

/**
 * The opposite of `_.pickBy`; this method creates an object composed of
 * the own and inherited enumerable string keyed properties of `object` that
 * `predicate` doesn't return truthy for. The predicate is invoked with two
 * arguments: (value, key).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The source object.
 * @param {Function} [predicate=_.identity] The function invoked per property.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.omitBy(object, _.isNumber);
 * // => { 'b': '2' }
 */
function omitBy(object, predicate) {
  return pickBy(object, negate(baseIteratee(predicate)));
}

export default omitBy;
