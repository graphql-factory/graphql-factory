/**
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="es" include="assign,capitalize,castArray,filter,find,forEach,get,has,identity,includes,intersection,isArray,isFunction,isNumber,isObject,isString,keys,map,noop,omit,reduce,set,union,uniq,values,without" -o src/common/lodash`
 * Copyright JS Foundation and other contributors <https://js.foundation/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
import arrayMap from './_arrayMap.js';
import baseIntersection from './_baseIntersection.js';
import baseRest from './_baseRest.js';
import castArrayLikeObject from './_castArrayLikeObject.js';

/**
 * Creates an array of unique values that are included in all given arrays
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons. The order and references of result values are
 * determined by the first array.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {...Array} [arrays] The arrays to inspect.
 * @returns {Array} Returns the new array of intersecting values.
 * @example
 *
 * _.intersection([2, 1], [2, 3]);
 * // => [2]
 */
var intersection = baseRest(function(arrays) {
  var mapped = arrayMap(arrays, castArrayLikeObject);
  return (mapped.length && mapped[0] === arrays[0])
    ? baseIntersection(mapped)
    : [];
});

export default intersection;
