'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();





var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

var get$2 = function get$2(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get$2(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

















var set$2 = function set$2(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set$2(parent, property, value, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    desc.value = value;
  } else {
    var setter = desc.set;

    if (setter !== undefined) {
      setter.call(receiver, value);
    }
  }

  return value;
};

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';
var arrayTag = '[object Array]';
var boolTag = '[object Boolean]';
var dateTag = '[object Date]';
var errorTag = '[object Error]';
var funcTag = '[object Function]';
var genTag = '[object GeneratorFunction]';
var mapTag = '[object Map]';
var numberTag = '[object Number]';
var objectTag = '[object Object]';
var promiseTag = '[object Promise]';
var regexpTag = '[object RegExp]';
var setTag = '[object Set]';
var stringTag = '[object String]';
var symbolTag = '[object Symbol]';
var weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]';
var dataViewTag = '[object DataView]';
var float32Tag = '[object Float32Array]';
var float64Tag = '[object Float64Array]';
var int8Tag = '[object Int8Array]';
var int16Tag = '[object Int16Array]';
var int32Tag = '[object Int32Array]';
var uint8Tag = '[object Uint8Array]';
var uint8ClampedTag = '[object Uint8ClampedArray]';
var uint16Tag = '[object Uint16Array]';
var uint32Tag = '[object Uint32Array]';

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag] = cloneableTags[arrayTag] = cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] = cloneableTags[boolTag] = cloneableTags[dateTag] = cloneableTags[float32Tag] = cloneableTags[float64Tag] = cloneableTags[int8Tag] = cloneableTags[int16Tag] = cloneableTags[int32Tag] = cloneableTags[mapTag] = cloneableTags[numberTag] = cloneableTags[objectTag] = cloneableTags[regexpTag] = cloneableTags[setTag] = cloneableTags[stringTag] = cloneableTags[symbolTag] = cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] = cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag] = cloneableTags[funcTag] = cloneableTags[weakMapTag] = false;

/** Detect free variable `global` from Node.js. */
var freeGlobal = (typeof global === 'undefined' ? 'undefined' : _typeof(global)) == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = (typeof self === 'undefined' ? 'undefined' : _typeof(self)) == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Detect free variable `exports`. */
var freeExports = (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && (typeof module === 'undefined' ? 'undefined' : _typeof(module)) == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = function () {
  try {
    return freeProcess && freeProcess.binding('util');
  } catch (e) {}
}();

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * Adds the key-value `pair` to `map`.
 *
 * @private
 * @param {Object} map The map to modify.
 * @param {Array} pair The key-value pair to add.
 * @returns {Object} Returns `map`.
 */
function addMapEntry(map, pair) {
  // Don't return `map.set` because it's not chainable in IE 11.
  map.set(pair[0], pair[1]);
  return map;
}

/**
 * Adds `value` to `set`.
 *
 * @private
 * @param {Object} set The set to modify.
 * @param {*} value The value to add.
 * @returns {Object} Returns `set`.
 */
function addSetEntry(set$$1, value) {
  // Don't return `set.add` because it's not chainable in IE 11.
  set$$1.add(value);
  return set$$1;
}

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);
    case 1:
      return func.call(thisArg, args[0]);
    case 2:
      return func.call(thisArg, args[0], args[1]);
    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array ? array.length : 0;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/**
 * A specialized version of `_.reduce` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initAccum] Specify using the first element of `array` as
 *  the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce(array, iteratee, accumulator, initAccum) {
  var index = -1,
      length = array ? array.length : 0;

  if (initAccum && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }
  return accumulator;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function (value) {
    return func(value);
  };
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function (value, key) {
    result[++index] = [key, value];
  });
  return result;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function (arg) {
    return func(transform(arg));
  };
}

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set$$1) {
  var index = -1,
      result = Array(set$$1.size);

  set$$1.forEach(function (value) {
    result[++index] = value;
  });
  return result;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype;
var funcProto = Function.prototype;
var objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey = function () {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? 'Symbol(src)_1.' + uid : '';
}();

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' + funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined;
var _Symbol = root.Symbol;
var Uint8Array = root.Uint8Array;
var getPrototype = overArg(Object.getPrototypeOf, Object);
var objectCreate = Object.create;
var propertyIsEnumerable = objectProto.propertyIsEnumerable;
var splice = arrayProto.splice;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;
var nativeKeys = overArg(Object.keys, Object);
var nativeMax = Math.max;

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView');
var Map = getNative(root, 'Map');
var Promise$1 = getNative(root, 'Promise');
var Set = getNative(root, 'Set');
var WeakMap = getNative(root, 'WeakMap');
var nativeCreate = getNative(Object, 'create');

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = toSource(DataView);
var mapCtorString = toSource(Map);
var promiseCtorString = toSource(Promise$1);
var setCtorString = toSource(Set);
var weakMapCtorString = toSource(WeakMap);

/** Used to convert symbols to primitives and strings. */
var symbolProto = _Symbol ? _Symbol.prototype : undefined;
var symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  return this.has(key) && delete this.__data__[key];
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED : value;
  return this;
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.__data__ = {
    'hash': new Hash(),
    'map': new (Map || ListCache)(),
    'string': new Hash()
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  return getMapData(this, key)['delete'](key);
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  getMapData(this, key).set(key, value);
  return this;
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  this.__data__ = new ListCache(entries);
}

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache();
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  return this.__data__['delete'](key);
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var cache = this.__data__;
  if (cache instanceof ListCache) {
    var pairs = cache.__data__;
    if (!Map || pairs.length < LARGE_ARRAY_SIZE - 1) {
      pairs.push([key, value]);
      return this;
    }
    cache = this.__data__ = new MapCache(pairs);
  }
  cache.set(key, value);
  return this;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  // Safari 9 makes `arguments.length` enumerable in strict mode.
  var result = isArray$1(value) || isArguments(value) ? baseTimes(value.length, String) : [];

  var length = result.length,
      skipIndexes = !!length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == 'length' || isIndex(key, length)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * This function is like `assignValue` except that it doesn't assign
 * `undefined` values.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignMergeValue(object, key, value) {
  if (value !== undefined && !eq(object[key], value) || typeof key == 'number' && value === undefined && !(key in object)) {
    object[key] = value;
  }
}

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) || value === undefined && !(key in object)) {
    object[key] = value;
  }
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.assign` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return object && copyObject(source, keys$1(source), object);
}

/**
 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
 * traversed objects.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @param {boolean} [isFull] Specify a clone including symbols.
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, isDeep, isFull, customizer, key, object, stack) {
  var result;
  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject$1(value)) {
    return value;
  }
  var isArr = isArray$1(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) {
      return copyArray(value, result);
    }
  } else {
    var tag = getTag(value),
        isFunc = tag == funcTag || tag == genTag;

    if (isBuffer(value)) {
      return cloneBuffer(value, isDeep);
    }
    if (tag == objectTag || tag == argsTag || isFunc && !object) {
      if (isHostObject(value)) {
        return object ? value : {};
      }
      result = initCloneObject(isFunc ? {} : value);
      if (!isDeep) {
        return copySymbols(value, baseAssign(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = initCloneByTag(value, tag, baseClone, isDeep);
    }
  }
  // Check for circular references and return its corresponding clone.
  stack || (stack = new Stack());
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);

  if (!isArr) {
    var props = isFull ? getAllKeys(value) : keys$1(value);
  }
  arrayEach(props || value, function (subValue, key) {
    if (props) {
      key = subValue;
      subValue = value[key];
    }
    // Recursively populate clone (susceptible to call stack limits).
    assignValue(result, key, baseClone(subValue, isDeep, isFull, customizer, key, value, stack));
  });
  return result;
}

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} prototype The object to inherit from.
 * @returns {Object} Returns the new object.
 */
function baseCreate(proto) {
  return isObject$1(proto) ? objectCreate(proto) : {};
}

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray$1(object) ? result : arrayPush(result, symbolsFunc(object));
}

/**
 * The base implementation of `getTag`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  return objectToString.call(value);
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject$1(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction$1(value) || isHostObject(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objectToString.call(value)];
}

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  if (!isObject$1(object)) {
    return nativeKeysIn(object);
  }
  var isProto = isPrototype(object),
      result = [];

  for (var key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * The base implementation of `_.merge` without support for multiple sources.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMerge(object, source, srcIndex, customizer, stack) {
  if (object === source) {
    return;
  }
  if (!(isArray$1(source) || isTypedArray(source))) {
    var props = baseKeysIn(source);
  }
  arrayEach(props || source, function (srcValue, key) {
    if (props) {
      key = srcValue;
      srcValue = source[key];
    }
    if (isObject$1(srcValue)) {
      stack || (stack = new Stack());
      baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
    } else {
      var newValue = customizer ? customizer(object[key], srcValue, key + '', object, source, stack) : undefined;

      if (newValue === undefined) {
        newValue = srcValue;
      }
      assignMergeValue(object, key, newValue);
    }
  });
}

/**
 * A specialized version of `baseMerge` for arrays and objects which performs
 * deep merges and tracks traversed objects enabling objects with circular
 * references to be merged.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {string} key The key of the value to merge.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} mergeFunc The function to merge values.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
  var objValue = object[key],
      srcValue = source[key],
      stacked = stack.get(srcValue);

  if (stacked) {
    assignMergeValue(object, key, stacked);
    return;
  }
  var newValue = customizer ? customizer(objValue, srcValue, key + '', object, source, stack) : undefined;

  var isCommon = newValue === undefined;

  if (isCommon) {
    newValue = srcValue;
    if (isArray$1(srcValue) || isTypedArray(srcValue)) {
      if (isArray$1(objValue)) {
        newValue = objValue;
      } else if (isArrayLikeObject(objValue)) {
        newValue = copyArray(objValue);
      } else {
        isCommon = false;
        newValue = baseClone(srcValue, true);
      }
    } else if (isPlainObject(srcValue) || isArguments(srcValue)) {
      if (isArguments(objValue)) {
        newValue = toPlainObject(objValue);
      } else if (!isObject$1(objValue) || srcIndex && isFunction$1(objValue)) {
        isCommon = false;
        newValue = baseClone(srcValue, true);
      } else {
        newValue = objValue;
      }
    } else {
      isCommon = false;
    }
  }
  if (isCommon) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    stack.set(srcValue, newValue);
    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
    stack['delete'](srcValue);
  }
  assignMergeValue(object, key, newValue);
}

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  start = nativeMax(start === undefined ? func.length - 1 : start, 0);
  return function () {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = array;
    return apply(func, this, otherArgs);
  };
}

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var result = new buffer.constructor(buffer.length);
  buffer.copy(result);
  return result;
}

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
  return result;
}

/**
 * Creates a clone of `dataView`.
 *
 * @private
 * @param {Object} dataView The data view to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned data view.
 */
function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

/**
 * Creates a clone of `map`.
 *
 * @private
 * @param {Object} map The map to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned map.
 */
function cloneMap(map, isDeep, cloneFunc) {
  var array = isDeep ? cloneFunc(mapToArray(map), true) : mapToArray(map);
  return arrayReduce(array, addMapEntry, new map.constructor());
}

/**
 * Creates a clone of `regexp`.
 *
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}

/**
 * Creates a clone of `set`.
 *
 * @private
 * @param {Object} set The set to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned set.
 */
function cloneSet(set$$1, isDeep, cloneFunc) {
  var array = isDeep ? cloneFunc(setToArray(set$$1), true) : setToArray(set$$1);
  return arrayReduce(array, addSetEntry, new set$$1.constructor());
}

/**
 * Creates a clone of the `symbol` object.
 *
 * @private
 * @param {Object} symbol The symbol object to clone.
 * @returns {Object} Returns the cloned symbol object.
 */
function cloneSymbol(symbol) {
  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
}

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer ? customizer(object[key], source[key], key, object, source) : undefined;

    assignValue(object, key, newValue === undefined ? source[key] : newValue);
  }
  return object;
}

/**
 * Copies own symbol properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbols(source, object) {
  return copyObject(source, getSymbols(source), object);
}

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return baseRest(function (object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = assigner.length > 3 && typeof customizer == 'function' ? (length--, customizer) : undefined;

    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return baseGetAllKeys(object, keys$1, getSymbols);
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/**
 * Creates an array of the own enumerable symbol properties of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = nativeGetSymbols ? overArg(nativeGetSymbols, Object) : stubArray;

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11,
// for data views in Edge < 14, and promises in Node.js.
if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map && getTag(new Map()) != mapTag || Promise$1 && getTag(Promise$1.resolve()) != promiseTag || Set && getTag(new Set()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
  getTag = function getTag(value) {
    var result = objectToString.call(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : undefined;

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString:
          return dataViewTag;
        case mapCtorString:
          return mapTag;
        case promiseCtorString:
          return promiseTag;
        case setCtorString:
          return setTag;
        case weakMapCtorString:
          return weakMapTag;
      }
    }
    return result;
  };
}

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = array.constructor(length);

  // Add properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  return typeof object.constructor == 'function' && !isPrototype(object) ? baseCreate(getPrototype(object)) : {};
}

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, cloneFunc, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag:
      return cloneArrayBuffer(object);

    case boolTag:
    case dateTag:
      return new Ctor(+object);

    case dataViewTag:
      return cloneDataView(object, isDeep);

    case float32Tag:case float64Tag:
    case int8Tag:case int16Tag:case int32Tag:
    case uint8Tag:case uint8ClampedTag:case uint16Tag:case uint32Tag:
      return cloneTypedArray(object, isDeep);

    case mapTag:
      return cloneMap(object, isDeep, cloneFunc);

    case numberTag:
    case stringTag:
      return new Ctor(object);

    case regexpTag:
      return cloneRegExp(object);

    case setTag:
      return cloneSet(object, isDeep, cloneFunc);

    case symbolTag:
      return cloneSymbol(object);
  }
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length && (typeof value == 'number' || reIsUint.test(value)) && value > -1 && value % 1 == 0 && value < length;
}

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject$1(object)) {
    return false;
  }
  var type = typeof index === 'undefined' ? 'undefined' : _typeof(index);
  if (type == 'number' ? isArrayLike(object) && isIndex(index, object.length) : type == 'string' && index in object) {
    return eq(object[index], value);
  }
  return false;
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && maskSrcKey in func;
}

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = typeof Ctor == 'function' && Ctor.prototype || objectProto;

  return value === proto;
}

/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to process.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return func + '';
    } catch (e) {}
  }
  return '';
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || value !== value && other !== other;
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') && (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray$1 = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction$1(value);
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction$1(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject$1(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject$1(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object';
}

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!isObjectLike(value) || objectToString.call(value) != objectTag || isHostObject(value)) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
}

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

/**
 * Converts `value` to a plain object flattening inherited enumerable string
 * keyed properties of `value` to own properties of the plain object.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Object} Returns the converted plain object.
 * @example
 *
 * function Foo() {
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.assign({ 'a': 1 }, new Foo);
 * // => { 'a': 1, 'b': 2 }
 *
 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
 * // => { 'a': 1, 'b': 2, 'c': 3 }
 */
function toPlainObject(value) {
  return copyObject(value, keysIn(value));
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys$1(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
}

/**
 * This method is like `_.assign` except that it recursively merges own and
 * inherited enumerable string keyed properties of source objects into the
 * destination object. Source properties that resolve to `undefined` are
 * skipped if a destination value exists. Array and plain object properties
 * are merged recursively. Other objects and value types are overridden by
 * assignment. Source objects are applied from left to right. Subsequent
 * sources overwrite property assignments of previous sources.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 0.5.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = {
 *   'a': [{ 'b': 2 }, { 'd': 4 }]
 * };
 *
 * var other = {
 *   'a': [{ 'c': 3 }, { 'e': 5 }]
 * };
 *
 * _.merge(object, other);
 * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
 */
var merge$1 = createAssigner(function (object, source, srcIndex) {
  baseMerge(object, source, srcIndex);
});

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

/*
 * @name - graphql-obj2arg
 * @description - Convert JavaScript a object into a GraphQL argument string
 * @author - Branden Horiuchi <bhoriuchi@gmail.com>
 *
 */
var ARRAY = 'array';
var BOOLEAN = 'boolean';
var DATE = 'date';
var ENUM = 'enum';
var FLOAT = 'float';
var INT = 'int';
var NULL = 'null';
var NUMBER = 'number';
var OBJECT = 'object';
var STRING = 'string';
var UNDEFINED = 'undefined';
var RX_BOOLEAN = /^Boolean::/;
var RX_DATE = /^Date::/;
var RX_ENUM = /^Enum::/;
var RX_FLOAT = /^Float::/;
var RX_INT = /^Int::/;
var RX_OUTER_BRACES = /^{|^\[|\]$|}$/g;

function getType$1(obj) {
  if (obj === null) {
    return { obj: obj, type: NULL };
  } else if (obj === undefined) {
    return { obj: obj, type: UNDEFINED };
  } else if (obj instanceof Enum) {
    return { obj: obj.value, type: ENUM };
  } else if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === STRING) {
    if (obj.match(RX_BOOLEAN)) return { obj: Boolean(obj.replace(RX_BOOLEAN, '')), type: BOOLEAN };
    if (obj.match(RX_DATE)) return { obj: new Date(obj.replace(RX_DATE, '')), type: DATE };
    if (obj.match(RX_ENUM)) return { obj: obj.replace(RX_ENUM, ''), type: ENUM };
    if (obj.match(RX_FLOAT)) return { obj: obj.replace(RX_FLOAT, ''), type: FLOAT };
    if (obj.match(RX_INT)) return { obj: obj.replace(RX_INT, ''), type: INT };
    return { obj: obj, type: STRING };
  } else if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === BOOLEAN) {
    return { obj: obj, type: BOOLEAN };
  } else if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === NUMBER) {
    return obj % 1 === 0 ? { obj: obj, type: INT } : { obj: obj, type: FLOAT };
  } else if (Array.isArray(obj)) {
    return { obj: obj, type: ARRAY };
  } else if (obj instanceof Date) {
    return { obj: obj, type: DATE };
  } else if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === OBJECT) {
    return { obj: obj, type: OBJECT };
  } else {
    return { obj: obj, type: UNDEFINED };
  }
}

var toArguments = function toArguments(obj) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var keepNulls = options.keepNulls === true ? true : false;
  var noOuterBraces = options.noOuterBraces === true ? true : false;

  var toLiteral = function toLiteral(o) {
    var _getType = getType$1(o),
        obj = _getType.obj,
        type = _getType.type;

    var _ret = function () {
      switch (type) {
        case ARRAY:
          var arrList = [];
          forEach(obj, function (v) {
            var arrVal = toLiteral(v);
            if (arrVal === NULL && keepNulls || arrVal && arrVal !== NULL) arrList.push(arrVal);
          });
          return {
            v: '[' + arrList.join(',') + ']'
          };
        case OBJECT:
          var objList = [];
          forEach(obj, function (v, k) {
            var objVal = toLiteral(v);
            if (objVal === NULL && keepNulls || objVal && objVal !== NULL) objList.push(k + ':' + objVal);
          });
          return {
            v: '{' + objList.join(',') + '}'
          };
        case DATE:
          return {
            v: '"' + obj.toISOString() + '"'
          };
        case FLOAT:
          var s = String(obj);
          return {
            v: s.indexOf('.') === -1 ? s + '.0' : s
          };
        case NULL:
          return {
            v: NULL
          };
        case STRING:
          return {
            v: '"' + escapeString(obj) + '"'
          };
        case UNDEFINED:
          return {
            v: undefined
          };
        default:
          return {
            v: String(obj)
          };
      }
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
  };

  var objStr = toLiteral(circular(obj));
  return noOuterBraces ? objStr.replace(RX_OUTER_BRACES, '') : objStr;
};

toArguments.Enum = Enum;
toArguments.escapeString = escapeString;

/* lodash like functions to remove dependency on lodash accept lodash.merge */
// enum type for use with toObjectString function
function Enum(value) {
  if (!(this instanceof Enum)) return new Enum(value);
  this.value = value;
}

function isBoolean(obj) {
  return obj === true || obj === false;
}

function isEnum(obj) {
  return obj instanceof Enum;
}

function isFunction(obj) {
  return typeof obj === 'function';
}

function isString(obj) {
  return typeof obj === 'string';
}

function isArray(obj) {
  return Array.isArray(obj);
}

function isDate(obj) {
  return obj instanceof Date;
}

function isObject(obj) {
  return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null;
}

function isNumber(obj) {
  return !isNaN(obj);
}

function isHash(obj) {
  return isObject(obj) && !isArray(obj) && !isDate(obj) && obj !== null;
}

function includes(obj, key) {
  try {
    return isArray(obj) && obj.indexOf(key) !== -1;
  } catch (err) {
    return false;
  }
}

function toLower(str) {
  if (typeof str === 'string') return str.toLocaleLowerCase();
  return '';
}

function toUpper(str) {
  if (typeof str === 'string') return str.toUpperCase();
  return '';
}

function ensureArray() {
  var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

  return isArray(obj) ? obj : [obj];
}

function isEmpty(obj) {
  if (!obj) return true;else if (isArray(obj) && !obj.length) return true;else if (isHash(obj) && !keys(obj).length) return true;
  return false;
}

function keys(obj) {
  try {
    return Object.keys(obj);
  } catch (err) {
    return [];
  }
}

function capitalize(str) {
  if (isString(str) && str.length > 0) {
    var first = str[0];
    var rest = str.length > 1 ? str.substring(1) : '';
    str = [first.toUpperCase(), rest.toLowerCase()].join('');
  }
  return str;
}

function stringToPathArray(pathString) {
  // taken from lodash - https://github.com/lodash/lodash
  var pathRx = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(\.|\[\])(?:\4|$))/g;
  var pathArray = [];

  if (isString(pathString)) {
    pathString.replace(pathRx, function (match, number, quote, string) {
      pathArray.push(quote ? string : number !== undefined ? Number(number) : match);
      return pathArray[pathArray.length - 1];
    });
  }
  return pathArray;
}

function has$1(obj, path) {
  var value = obj;
  var fields = isArray(path) ? path : stringToPathArray(path);
  if (fields.length === 0) return false;
  try {
    for (var f in fields) {
      if (!value[fields[f]]) return false;else value = value[fields[f]];
    }
  } catch (err) {
    return false;
  }
  return true;
}

function forEach(obj, fn) {
  try {
    if (Array.isArray(obj)) {
      var idx = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = obj[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var val = _step.value;

          if (fn(val, idx) === false) break;
          idx++;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    } else {
      for (var key in obj) {
        if (fn(obj[key], key) === false) break;
      }
    }
  } catch (err) {
    return;
  }
}

function without() {
  var output = [];
  var args = [].concat(Array.prototype.slice.call(arguments));
  if (args.length === 0) return output;else if (args.length === 1) return args[0];
  var search = args.slice(1);
  forEach(args[0], function (val) {
    if (!includes(search, val)) output.push(val);
  });
  return output;
}

function map(obj, fn) {
  var output = [];
  try {
    for (var key in obj) {
      output.push(fn(obj[key], key));
    }
  } catch (err) {
    return [];
  }
  return output;
}

function mapValues(obj, fn) {
  var newObj = {};
  try {
    forEach(obj, function (v, k) {
      newObj[k] = fn(v, k);
    });
  } catch (err) {
    return obj;
  }
  return newObj;
}

function remap(obj, fn) {
  var newObj = {};
  forEach(obj, function (v, k) {
    var newMap = fn(v, k);
    if (has$1(newMap, 'key') && has$1(newMap, 'value')) newObj[newMap.key] = newMap.value;else newMap[k] = v;
  });
  return newObj;
}

function filter(obj, fn) {
  var newObj = [];
  if (!isArray(obj)) return newObj;
  forEach(obj, function (v, k) {
    if (fn(v, k)) newObj.push(v);
  });
  return newObj;
}

function omitBy(obj, fn) {
  var newObj = {};
  if (!isHash(obj)) return newObj;
  forEach(obj, function (v, k) {
    if (!fn(v, k)) newObj[k] = v;
  });
  return newObj;
}

function omit(obj) {
  var omits = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  var newObj = {};
  omits = ensureArray(omits);
  forEach(obj, function (v, k) {
    if (!includes(omits, k)) newObj[k] = v;
  });
  return newObj;
}

function pickBy(obj, fn) {
  var newObj = {};
  if (!isHash(obj)) return newObj;
  forEach(obj, function (v, k) {
    if (fn(v, k)) newObj[k] = v;
  });
  return newObj;
}

function pick(obj) {
  var picks = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  var newObj = {};
  picks = ensureArray(picks);
  forEach(obj, function (v, k) {
    if (includes(picks, k)) newObj[k] = v;
  });
  return newObj;
}

function get$1(obj, path, defaultValue) {
  var value = obj;
  var fields = isArray(path) ? path : stringToPathArray(path);
  if (fields.length === 0) return defaultValue;

  try {
    for (var f in fields) {
      if (!value[fields[f]]) return defaultValue;else value = value[fields[f]];
    }
  } catch (err) {
    return defaultValue;
  }
  return value;
}

function set$1(obj, path, val) {
  var value = obj;
  var fields = isArray(path) ? path : stringToPathArray(path);
  forEach(fields, function (p, idx) {
    if (idx === fields.length - 1) value[p] = val;else if (!value[p]) value[p] = isNumber(p) ? [] : {};
    value = value[p];
  });
}

function clone$1(obj) {
  return merge$1({}, obj);
}

function typeOf(obj) {
  if (obj === undefined) return 'UNDEFINED';
  if (obj === null) return 'NULL';
  if (isBoolean(obj)) return 'BOOLEAN';
  if (isArray(obj)) return 'ARRAY';
  if (isString(obj)) return 'STRING';
  if (isNumber(obj)) return 'NUMBER';
  if (isDate(obj)) return 'DATE';
  if (isHash(obj)) return 'HASH';
  if (isObject(obj)) return 'OBJECT';
}

/*
 * Gets the path of a value by getting the location of the field and traversing the selectionSet
 */
function getFieldPath(info, maxDepth) {
  maxDepth = maxDepth || 50;

  var loc = get$1(info, 'fieldASTs[0].loc');
  var stackCount = 0;

  var traverseFieldPath = function traverseFieldPath(selections, start, end, fieldPath) {
    fieldPath = fieldPath || [];

    var sel = get$1(filter(selections, function (s) {
      return s.loc.start <= start && s.loc.end >= end;
    }), '[0]');
    if (sel) {
      fieldPath.push(sel.name.value);
      if (sel.name.loc.start !== start && sel.name.loc.end !== end && stackCount < maxDepth) {
        stackCount++;
        traverseFieldPath(sel.selectionSet.selections, start, end, fieldPath);
      }
    }
    return fieldPath;
  };
  if (!info.operation.selectionSet.selections || isNaN(loc.start) || isNaN(loc.end)) return;
  return traverseFieldPath(info.operation.selectionSet.selections, loc.start, loc.end);
}

function getSchemaOperation(info) {
  var _type = ['_', get$1(info, 'operation.operation'), 'Type'].join('');
  return get$1(info, ['schema', _type].join('.'), {});
}

/*
 * Gets the return type name of a query (returns shortened GraphQL primitive type names)
 */
function getReturnTypeName(info) {
  try {
    var typeObj = get$1(getSchemaOperation(info), '_fields["' + info.fieldName + '"].type', {});

    while (!typeObj.name) {
      typeObj = typeObj.ofType;
      if (!typeObj) break;
    }
    return typeObj.name;
  } catch (err) {
    console.error(err.message);
  }
}

/*
 * Gets the field definition
 */
function getRootFieldDef(info, path) {
  var fldPath = get$1(getFieldPath(info), '[0]');
  var queryType = info.operation.operation;
  var opDef = get$1(info, 'schema._factory.' + queryType + 'Def', {});
  var fieldDef = get$1(opDef, 'fields["' + fldPath + '"]', undefined);

  //  if a field def cannot be found, try to find it in the extendFields
  if (!fieldDef && has$1(opDef, 'extendFields')) {
    forEach(opDef.extendFields, function (v, k) {
      if (has$1(v, fldPath)) fieldDef = get$1(v, '["' + fldPath + '"]', {});
    });
  }

  return path ? get$1(fieldDef, path, {}) : fieldDef;
}

/*
 * Returns the _typeConfig object of the schema operation (query/mutation)
 * Can be used to pass variables to resolve functions which use this function
 * to access those variables
 */
function getTypeConfig(info, path) {
  path = path ? '_typeConfig.'.concat(path) : '_typeConfig';
  return get$1(getSchemaOperation(info), path, {});
}

// removes circular references
function circular(obj) {
  var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '[Circular]';

  var circularEx = function circularEx(_obj) {
    var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var seen = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

    seen.push(_obj);
    if (isObject(_obj)) {
      forEach(_obj, function (o, i) {
        if (includes(seen, o)) _obj[i] = isFunction(value) ? value(_obj, key, seen.slice(0)) : value;else circularEx(o, i, seen.slice(0));
      });
    }
    return _obj;
  };

  if (!obj) throw new Error('circular requires an object to examine');
  return circularEx(obj, value);
}

function escapeString(str) {
  if (!isString(str)) return '';
  return String(str).replace(/\\/gm, '\\\\').replace(/\//gm, '\\/').replace(/\b/gm, '').replace(/\f/gm, '\\f').replace(/\n/gm, '\\n').replace(/\r/gm, '\\r').replace(/\t/gm, '\\t').replace(/"/gm, '\\"');
}

var utils = {};



var _$1 = Object.freeze({
	toObjectString: toArguments,
	merge: merge$1,
	Enum: Enum,
	isBoolean: isBoolean,
	isEnum: isEnum,
	isFunction: isFunction,
	isString: isString,
	isArray: isArray,
	isDate: isDate,
	isObject: isObject,
	isNumber: isNumber,
	isHash: isHash,
	includes: includes,
	toLower: toLower,
	toUpper: toUpper,
	ensureArray: ensureArray,
	isEmpty: isEmpty,
	keys: keys,
	capitalize: capitalize,
	stringToPathArray: stringToPathArray,
	has: has$1,
	forEach: forEach,
	without: without,
	map: map,
	mapValues: mapValues,
	remap: remap,
	filter: filter,
	omitBy: omitBy,
	omit: omit,
	pickBy: pickBy,
	pick: pick,
	get: get$1,
	set: set$1,
	clone: clone$1,
	typeOf: typeOf,
	getFieldPath: getFieldPath,
	getSchemaOperation: getSchemaOperation,
	getReturnTypeName: getReturnTypeName,
	getRootFieldDef: getRootFieldDef,
	getTypeConfig: getTypeConfig,
	circular: circular,
	escapeString: escapeString,
	default: utils
});

// built in type name constants
var BOOLEAN$1 = 'Boolean';
var ENUM$1 = 'Enum';
var FLOAT$1 = 'Float';
var ID = 'ID';
var INPUT = 'Input';
var INT$1 = 'Int';
var INTERFACE = 'Interface';
var LIST = 'List';
var NONNULL = 'NonNull';
var OBJECT$1 = 'Object';
var SCALAR = 'Scalar';
var SCHEMA = 'Schema';
var STRING$1 = 'String';
var UNION = 'Union';

// build a type alias
var TYPE_ALIAS = {
  Enum: ENUM$1,
  Input: INPUT,
  Interface: INTERFACE,
  List: LIST,
  NonNull: NONNULL,
  Object: OBJECT$1,
  Scalar: SCALAR,
  Schema: SCHEMA,
  Union: UNION,
  GraphQLEnumType: ENUM$1,
  GraphQLInputObjectType: INPUT,
  GraphQLInterfaceType: INTERFACE,
  GraphQLList: LIST,
  GraphQLNonNull: NONNULL,
  GraphQLObjectType: OBJECT$1,
  GraphQLScalarType: SCALAR,
  GraphQLSchema: SCHEMA,
  GraphQLUnionType: UNION
};

// types with fields
var HAS_FIELDS = [OBJECT$1, INPUT, INTERFACE];

var constants = {
  BOOLEAN: BOOLEAN$1,
  ENUM: ENUM$1,
  FLOAT: FLOAT$1,
  ID: ID,
  INPUT: INPUT,
  INT: INT$1,
  INTERFACE: INTERFACE,
  LIST: LIST,
  NONNULL: NONNULL,
  OBJECT: OBJECT$1,
  SCALAR: SCALAR,
  SCHEMA: SCHEMA,
  STRING: STRING$1,
  UNION: UNION,
  TYPE_ALIAS: TYPE_ALIAS,
  HAS_FIELDS: HAS_FIELDS
};

function getShortType(type) {
  return _$1.get(TYPE_ALIAS, type, null);
}

function hasFields(type) {
  return _$1.includes(HAS_FIELDS, getShortType(type));
}

function toTypeDef(obj) {
  return _$1.isHash(obj) ? obj : { type: obj };
}

function normalizeArgs(field) {
  _$1.forEach(field.args, function (arg, argName) {
    field.args[argName] = toTypeDef(arg);
  });
  return field;
}

var GraphQLFactoryCompiler = function () {
  function GraphQLFactoryCompiler(definition) {
    classCallCheck(this, GraphQLFactoryCompiler);

    this.definition = definition.clone();
    this.compiled = {
      fields: this.definition.fields || {},
      types: {},
      schemas: {}
    };
  }

  createClass(GraphQLFactoryCompiler, [{
    key: 'compile',
    value: function compile() {
      this.moveSchema();
      this.normalizeTypes();
      this.mergeBase();
      this.extendTemplates();
      this.conditionalTypes();
      return this.compiled;
    }
  }, {
    key: 'moveSchema',
    value: function moveSchema() {
      var _this = this;

      _$1.forEach(this.definition.schemas, function (schema, schemaName) {
        _this.compiled.schemas[schemaName] = _$1.mapValues(schema, function (definition, operation) {
          if (_$1.isString(definition)) return definition;
          var opName = definition.name || '' + schemaName + _$1.capitalize(operation);
          _$1.set(_this.definition, 'types["' + opName + '"]', definition);
          return opName;
        });
      });
    }
  }, {
    key: 'normalizeTypes',
    value: function normalizeTypes() {
      var types = this.compiled.types;

      _$1.forEach(this.definition.types, function (_typeDef, name) {
        if (!_$1.isHash(_typeDef)) return console.error(name + ' type definition is not an object');
        var type = _typeDef.type;


        switch (_$1.typeOf(type)) {
          case 'UNDEFINED':
            return types[name] = { type: OBJECT$1, _typeDef: _typeDef };

          case 'STRING':
            return types[name] = { type: type, _typeDef: _typeDef };

          case 'ARRAY':
            _$1.forEach(type, function (multi) {
              if (_$1.isString(multi)) return types[multi === OBJECT$1 ? name : '' + name + multi] = { type: type, _typeDef: _typeDef };
              _$1.forEach(multi, function (v, k) {
                if (k === OBJECT$1 && !v) return types[name] = { type: OBJECT$1, _typeDef: _typeDef };else if (k !== OBJECT$1 && !v) return types[name] = { type: k, _typeDef: _typeDef };
                return types[v] = { type: k, _typeDef: _typeDef };
              });
            });
            break;

          default:
            _$1.forEach(type, function (multi, mName) {
              if (mName === OBJECT$1 && !multi) return types[name] = { type: mName, _typeDef: _typeDef };else if (mName !== OBJECT$1 && !multi) return types['' + name + mName] = { type: mName, _typeDef: _typeDef };
              return types[multi] = { type: mName, _typeDef: _typeDef };
            });
            break;
        }
      });
    }
  }, {
    key: 'mergeBase',
    value: function mergeBase() {
      var _this2 = this;

      _$1.forEach(this.compiled.types, function (definition) {
        var type = definition.type,
            _typeDef = definition._typeDef;

        var typeDef = _$1.omit(_typeDef, 'type');
        delete definition._typeDef;

        // no type fields
        if (!hasFields(type)) {
          _$1.merge(definition, typeDef);
          if (getShortType(type) === ENUM$1) {
            (function () {
              var values = definition.values;

              _$1.forEach(values, function (v, k) {
                if (!_$1.isHash(v)) values[k] = { value: v };
              });
            })();
          }
          return true;
        }

        // type fields
        var extendFields = typeDef.extendFields;

        _$1.merge(definition, _$1.omit(typeDef, 'extendFields'));

        switch (_$1.typeOf(extendFields)) {
          case 'STRING':
            return _$1.merge(definition.fields, _$1.get(_this2.definition, 'fields["' + extendFields + '"]', {}));

          case 'ARRAY':
            _$1.forEach(extendFields, function (typeName) {
              _$1.merge(definitions.fields, _$1.get(_this2.definition, 'fields["' + typeName + '"]', {}));
            });
            break;

          case 'HASH':
            _$1.forEach(extendFields, function (extendDef, name) {
              var ext = _$1.get(_this2.definition, 'fields["' + name + '"]', {});
              _$1.forEach(extendDef, function (field, name) {
                var config = _$1.get(ext, name);
                if (!config) return true;
                config = toTypeDef(config);

                if (_$1.isArray(field) && field.length > 1) {
                  _$1.forEach(field, function (v, i) {
                    field[i] = _$1.merge({}, config, toTypeDef(v));
                  });
                  return true;
                }
                extendDef[name] = _$1.merge({}, config, toTypeDef(field));
              });
              _$1.merge(definition.fields, ext, extendDef);
            });
            break;

          default:
            break;
        }
      });
    }
  }, {
    key: 'extendTemplates',
    value: function extendTemplates() {
      _$1.forEach(this.compiled.types, function (definition) {
        var omits = [];
        var fieldBase = null;
        var fields = definition.fields;

        if (!fields) return true;
        _$1.forEach(fields, function (field, name) {
          if (_$1.isArray(field) && field.length > 1) {
            omits.push(name);
            _$1.forEach(field, function (type, idx) {
              normalizeArgs(type);

              if (type.name) {
                fieldBase = _$1.get(definition, 'fields["' + type.name + '"]', {});
                normalizeArgs(fieldBase);
                definition.fields[type.name] = _$1.merge({}, fieldBase, _$1.omit(type, 'name'));
                return true;
              }

              fieldBase = _$1.get(definition, 'fields["' + idx + '"]', {});
              normalizeArgs(fieldBase);
              definition.fields['' + name + idx] = _$1.merge({}, fieldBase, type);
            });
          }
        });
        definition.fields = _$1.omit(definition.fields, omits);
      });
    }
  }, {
    key: 'conditionalTypes',
    value: function conditionalTypes() {
      _$1.forEach(this.compiled.types, function (definition) {
        var omits = [];
        var fields = definition.fields;

        if (!fields) return true;

        _$1.forEach(fields, function (field, name) {
          switch (_$1.typeOf(field)) {
            case 'HASH':
              var type = field.type,
                  omitFrom = field.omitFrom;

              if (!type) {
                if (field[definition.type]) definition.fields[name] = normalizeArgs(toTypeDef(field[definition.type]));else omits.push(name);
              } else if (omitFrom) {
                if (_$1.includes(_$1.isArray(omitFrom) ? omitFrom : [omitFrom], definition.type)) omits.push(name);else normalizeArgs(_$1.omit(fields[name], 'omitFrom'));
              }
              break;

            default:
              definition.fields[name] = { type: field };
              break;
          }
        });
        definition.fields = _$1.omit(definition.fields, omits);
      });
    }
  }]);
  return GraphQLFactoryCompiler;
}();

var GraphQLFactoryDefinition = function () {
  function GraphQLFactoryDefinition() {
    var definition = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    classCallCheck(this, GraphQLFactoryDefinition);
    var globals = definition.globals,
        fields = definition.fields,
        functions = definition.functions,
        types = definition.types,
        schemas = definition.schemas,
        externalTypes = definition.externalTypes;

    this.globals = globals || {};
    this.fields = fields || {};
    this.functions = functions || {};
    this.types = types || {};
    this.schemas = schemas || {};
    this.externalTypes = externalTypes || {};
  }

  createClass(GraphQLFactoryDefinition, [{
    key: 'merge',
    value: function merge() {
      var definition = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var globals = definition.globals,
          fields = definition.fields,
          functions = definition.functions,
          types = definition.types,
          schemas = definition.schemas,
          externalTypes = definition.externalTypes;

      _$1.merge(this.globals, globals || {});
      _$1.merge(this.fields, fields || {});
      _$1.merge(this.functions, functions || {});
      _$1.merge(this.types, types || {});
      _$1.merge(this.schemas, schemas || {});
      _$1.merge(this.externalTypes, externalTypes || {});
    }
  }, {
    key: 'clone',
    value: function clone() {
      return _$1.merge({}, this.plugin);
    }
  }, {
    key: 'has',
    value: function has(keyPath) {
      return _$1.has(this, keyPath);
    }
  }, {
    key: 'get',
    value: function get(keyPath) {
      return _$1.get(this, keyPath);
    }
  }, {
    key: 'set',
    value: function set(keyPath, value) {
      _$1.set(this, keyPath, value);
    }
  }, {
    key: 'hasType',
    value: function hasType(typeName) {
      return this.has('types["' + typeName + '"]');
    }
  }, {
    key: 'getType',
    value: function getType(typeName) {
      return this.has('types["' + typeName + '"]');
    }
  }, {
    key: 'hasExtType',
    value: function hasExtType(typeName) {
      return this.has('externalTypes["' + typeName + '"]');
    }
  }, {
    key: 'getExtType',
    value: function getExtType(typeName) {
      return this.has('externalTypes["' + typeName + '"]');
    }
  }, {
    key: 'compile',
    value: function compile() {
      var compiler = new GraphQLFactoryCompiler(this);

      var _compiler$compile = compiler.compile(),
          fields = _compiler$compile.fields,
          types = _compiler$compile.types,
          schemas = _compiler$compile.schemas;

      this.fields = fields || {};
      this.types = types || {};
      this.schemas = schemas || {};
    }
  }, {
    key: 'definition',
    get: function get() {
      return {
        fields: this.fields,
        functions: this.functions,
        types: this.types,
        schemas: this.schemas,
        externalType: this.externalTypes
      };
    }
  }, {
    key: 'plugin',
    get: function get() {
      return {
        globals: this.globals,
        fields: this.fields,
        functions: this.functions,
        types: this.types,
        schemas: this.schemas,
        externalType: this.externalTypes
      };
    }
  }]);
  return GraphQLFactoryDefinition;
}();

function FactoryEnumValueConfig(_this, val) {
  try {
    var _ref = _$1.isObject(val) ? val : { value: val },
        value = _ref.value,
        deprecationReason = _ref.deprecationReason,
        description = _ref.description;

    return {
      value: value,
      deprecationReason: deprecationReason,
      description: description
    };
  } catch (err) {
    console.error('FactoryEnumValueConfig', err);
  }
}

function FactoryEnumValueConfigMap(_this, values) {
  try {
    return _$1.mapValues(values, function (value) {
      return FactoryEnumValueConfig(_this, value);
    });
  } catch (err) {
    console.error('FactoryEnumValueConfigMap', err);
  }
}

function FactoryGQLEnumType(_this, definition, nameDefault) {
  try {
    var name = definition.name,
        values = definition.values,
        description = definition.description;


    return new _this.graphql.GraphQLEnumType({
      name: name || nameDefault,
      values: FactoryEnumValueConfigMap(_this, values),
      description: description
    });
  } catch (err) {
    console.error('FactoryGQLEnumType', err);
  }
}

function FactoryInputObjectFieldConfig(_this, field, rootType) {
  try {
    var defaultValue = field.defaultValue,
        description = field.description;

    var type = _this.resolveType(field, rootType);

    return {
      type: type,
      defaultValue: defaultValue,
      description: description
    };
  } catch (err) {
    console.error('FactoryInputObjectFieldConfig', err);
  }
}

function FactoryInputObjectFieldConfigMapThunk(_this, fields, rootType) {
  try {
    fields = _$1.omitBy(fields, function (field) {
      var omitFrom = field.omitFrom;

      return omitFrom && (_$1.includes(omitFrom, rootType) || omitFrom === rootType);
    });

    if (!_$1.keys(fields).length) return;

    return function () {
      return _$1.mapValues(fields, function (field) {
        return FactoryInputObjectFieldConfig(_this, field, rootType);
      });
    };
  } catch (err) {
    console.error('FactoryInputObjectFieldConfigMapThunk', err);
  }
}

function FactoryGQLInputObjectType(_this, definition, nameDefault) {
  try {
    var name = definition.name,
        fields = definition.fields,
        description = definition.description;


    return new _this.graphql.GraphQLInputObjectType({
      name: name || nameDefault,
      fields: FactoryInputObjectFieldConfigMapThunk(_this, fields, 'Input'),
      description: description
    });
  } catch (err) {
    console.error('FactoryInputObjectFieldConfigMapThunk', err);
  }
}

function FactoryArgumentConfig(_this) {
  var arg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var rootType = arguments[2];

  try {
    arg = _$1.isString(arg) || _$1.isArray(arg) ? { type: arg } : arg;
    var _arg = arg,
        defaultValue = _arg.defaultValue,
        description = _arg.description;

    var type = _this.resolveType(arg, rootType);

    return {
      type: type,
      defaultValue: defaultValue,
      description: description
    };
  } catch (err) {
    console.error('FactoryArgumentConfig', err);
  }
}

function FactoryFieldConfigMapThunk(_this, fields, rootType) {
  try {
    fields = _$1.omitBy(fields, function (field) {
      var omitFrom = field.omitFrom;

      return omitFrom && (_$1.includes(omitFrom, rootType) || omitFrom === rootType);
    });

    if (!_$1.keys(fields).length) return;

    return function () {
      return _$1.mapValues(fields, function (field) {
        field = !_$1.has(field, 'type') && _$1.has(field, rootType) ? field[rootType] : field;
        var _field = field,
            args = _field.args,
            resolve = _field.resolve,
            deprecationReason = _field.deprecationReason,
            description = _field.description;


        return {
          type: _this.resolveType(field, rootType),
          args: _$1.mapValues(args, function (arg) {
            return FactoryArgumentConfig(_this, arg, rootType);
          }),
          resolve: _this.bindFunction(resolve),
          deprecationReason: deprecationReason,
          description: description
        };
      });
    };
  } catch (err) {
    console.error('FactoryFieldConfigMapThunk', err);
  }
}

function FactoryGQLInterfaceType(_this, definition, nameDefault) {
  try {
    var name = definition.name,
        fields = definition.fields,
        resolveType = definition.resolveType,
        description = definition.description;


    return new _this.graphql.GraphQLInterfaceType({
      name: name || nameDefault,
      fields: FactoryFieldConfigMapThunk(_this, fields, 'Interface'),
      resolveType: _this.bindFunction(resolveType),
      description: description
    });
  } catch (err) {
    console.error('FactoryGQLInterfaceType', err);
  }
}

function FactoryInterfacesThunk(_this) {
  var interfaces = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  try {
    var _ret = function () {
      if (!_$1.isArray(interfaces) || !interfaces.length) return {
          v: void 0
        };

      var thunk = _$1.without(_$1.map(interfaces, function (type) {
        var iface = _this.resolveType(type);
        if (iface instanceof _this.graphql.GraphQLInterfaceType) return iface;
        return null;
      }), null);

      return {
        v: thunk.length > 0 ? function () {
          return thunk;
        } : undefined
      };
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
  } catch (err) {
    console.error('FactoryInterfacesThunk', err);
  }
}

function FactoryGQLObjectType(_this, definition, nameDefault) {
  try {
    var name = definition.name,
        interfaces = definition.interfaces,
        fields = definition.fields,
        isTypeOf = definition.isTypeOf,
        description = definition.description;


    return new _this.graphql.GraphQLObjectType(_$1.merge({}, definition, {
      name: name || nameDefault,
      interfaces: FactoryInterfacesThunk(_this, interfaces),
      fields: FactoryFieldConfigMapThunk(_this, fields, 'Object'),
      isTypeOf: _this.bindFunction(isTypeOf),
      description: description
    }));
  } catch (err) {
    console.error('FactoryGQLObjectType', err);
  }
}

function FactoryGQLScalarType(_this, definition, nameDefault) {
  try {
    var name = definition.name,
        description = definition.description,
        serialize = definition.serialize,
        parseValue = definition.parseValue,
        parseLiteral = definition.parseLiteral;


    return new _this.graphql.GraphQLScalarType({
      name: name || nameDefault,
      description: description,
      serialize: _this.bindFunction(serialize),
      parseValue: _this.bindFunction(parseValue),
      parseLiteral: _this.bindFunction(parseLiteral)
    });
  } catch (err) {
    console.error('FactoryGQLScalarType', err);
  }
}

function FactoryGQLSchema(_this, definition, nameDefault) {
  try {
    var query = definition.query,
        mutation = definition.mutation,
        subscription = definition.subscription;


    var schema = new _this.graphql.GraphQLSchema({
      query: _this.types[query],
      mutation: _this.types[mutation],
      subscription: _this.types[subscription]
    });

    schema._factory = {
      key: nameDefault,
      query: _this.definition.getType(query),
      mutation: _this.definition.getType(mutation),
      subscription: _this.definition.getType(subscription)
    };

    return schema;
  } catch (err) {
    console.error('FactoryGQLSchema', err);
  }
}

function FactoryGQLUnionType(_this, definition, nameDefault) {
  try {
    var name = definition.name,
        types = definition.types,
        resolveType = definition.resolveType,
        description = definition.description;


    return new _this.graphql.GraphQLUnionType({
      name: name || nameDefault,
      types: _$1.map(types, function (type) {
        return _this.resolveType(type);
      }),
      resolveType: _this.bindFunction(resolveType),
      description: description
    });
  } catch (err) {
    console.error('FactoryGQLUnionType', err);
  }
}

/*
 * Type generator class
 */

var GraphQLFactoryTypeGenerator = function () {
  function GraphQLFactoryTypeGenerator(graphql, definition) {
    var _typeMap;

    classCallCheck(this, GraphQLFactoryTypeGenerator);

    this.graphql = graphql;
    this.definition = definition;
    this._types = null;
    this._schemas = null;
    this.fnContext = definition.plugin;
    this.typeMap = (_typeMap = {}, defineProperty(_typeMap, BOOLEAN$1, graphql.GraphQLBoolean), defineProperty(_typeMap, FLOAT$1, graphql.GraphQLFloat), defineProperty(_typeMap, ID, graphql.GraphQLID), defineProperty(_typeMap, INT$1, graphql.GraphQLInt), defineProperty(_typeMap, STRING$1, graphql.GraphQLString), _typeMap);
  }

  /****************************************************************************
   * Helpers
   ****************************************************************************/


  createClass(GraphQLFactoryTypeGenerator, [{
    key: 'bindFunction',
    value: function bindFunction(fn) {
      if (!fn) return;
      var resolver = _$1.isFunction(fn) ? fn : this.definition.get('functions["' + fn + '"]');
      if (!_$1.isFunction(resolver)) console.error('could not resolve function ' + fn);
      return resolver.bind(this.fnContext);
    }
  }, {
    key: 'makeFieldType',
    value: function makeFieldType(field) {
      var type = field.type,
          nullable = field.nullable,
          primary = field.primary;

      var isList = _$1.isArray(type) && type.length > 0;
      var nonNull = nullable === false || primary === true;
      var typeName = isList ? type[0] : type;
      var typeObj = null;

      if (_$1.has(this.types, '["' + typeName + '"]')) typeObj = this.types[typeName];else if (_$1.has(this.typeMap, '["' + typeName + '"]')) typeObj = this.typeMap[typeName];else if (this.definition.hasExtType(typeName)) typeObj = this.definition.getExtType(typeName);else if (_$1.has(this.graphql, '["' + typeName + '"]')) typeObj = this.graphql[typeName];else throw new Error('invalid type ' + typeName);

      var gqlType = isList ? new this.graphql.GraphQLList(typeObj) : typeObj;
      return nonNull ? new this.graphql.GraphQLNonNull(gqlType) : gqlType;
    }
  }, {
    key: 'resolveType',
    value: function resolveType(field, rootType) {
      field = _$1.isString(field) || _$1.isArray(field) ? { type: field } : field;
      var _field = field,
          type = _field.type;


      if (!type && _$1.has(field, '["' + rootType + '"]')) {
        return this.makeFieldType(_$1.merge({}, field, {
          type: field[rootType]
        }));
      }

      return this.makeFieldType(field);
    }
  }, {
    key: 'makeNonUnionTypes',
    value: function makeNonUnionTypes() {
      var _this = this;

      _$1.forEach(this.definition.types, function (definition, nameDefault) {
        var name = definition.name,
            type = definition.type;

        var fn = null;
        if (type === UNION) return;

        switch (type) {
          case ENUM$1:
            fn = FactoryGQLEnumType;
            break;
          case INPUT:
            fn = FactoryGQLInputObjectType;
            break;
          case INTERFACE:
            fn = FactoryGQLInterfaceType;
            break;
          case OBJECT$1:
            fn = FactoryGQLObjectType;
            break;
          case SCALAR:
            fn = FactoryGQLScalarType;
            break;
          default:
            throw new Error(type + ' is an invalid base type');
        }
        _this._types[name || nameDefault] = fn(_this, definition, nameDefault);
      });
    }
  }, {
    key: 'makeUnionTypes',
    value: function makeUnionTypes() {
      var _this2 = this;

      _$1.forEach(this.definition.types, function (definition, nameDefault) {
        var name = definition.name,
            type = definition.type;

        if (type !== UNION) return;
        _this2._types[name || nameDefault] = FactoryGQLUnionType(_this2, definition, nameDefault);
      });
    }
  }, {
    key: 'makeSchemas',
    value: function makeSchemas() {
      var _this3 = this;

      _$1.forEach(this.definition.schemas, function (definition, nameDefault) {
        var name = definition.name;

        _this3._schemas[name || nameDefault] = FactoryGQLSchema(_this3, definition, nameDefault);
      });
    }

    /****************************************************************************
     * Getters
     ****************************************************************************/

  }, {
    key: 'types',
    get: function get() {
      if (this._types !== null) return this._types;
      this._types = {};
      this.makeNonUnionTypes();
      this.makeUnionTypes();
      return this._types;
    }
  }, {
    key: 'schemas',
    get: function get() {
      if (this._schemas !== null) return this._schemas;
      this._schemas = {};
      this.makeSchemas();
      return this._schemas;
    }
  }]);
  return GraphQLFactoryTypeGenerator;
}();

var GraphQLFactoryLibrary = function GraphQLFactoryLibrary(graphql, definition) {
  var _this = this;

  classCallCheck(this, GraphQLFactoryLibrary);

  var generator = new GraphQLFactoryTypeGenerator(graphql, definition);

  // store original and compiled definitions/types
  this._definitions = {
    graphql: graphql,
    definition: definition.definition,
    types: generator.types,
    schemas: generator.schemas
  };

  // build schema functions
  _$1.forEach(generator.schemas, function (schema, name) {
    _this[name] = function (requestString, rootValue, contextValue, variableValues, operationName) {
      return graphql.graphql(schema, requestString, rootValue, contextValue, variableValues, operationName);
    };
  });
};

function compile$1(definition) {
  var def = new GraphQLFactoryDefinition(definition);
  def.compile();
  return def.plugin;
}

var GraphQLFactory$1 = function () {
  function GraphQLFactory(graphql) {
    classCallCheck(this, GraphQLFactory);

    this.graphql = graphql;
    this.definition = new GraphQLFactoryDefinition();
    this.compile = compile$1;
    this.utils = _$1;
    this.constants = constants;
  }

  createClass(GraphQLFactory, [{
    key: 'plugin',
    value: function plugin() {
      var _this = this;

      var plugins = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      _$1.forEach(_$1.ensureArray(plugins), function (p) {
        return _this.definition.merge(p);
      });
    }
  }, {
    key: 'make',
    value: function make() {
      var definition = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var plugin = options.plugin;

      this.plugin(plugin);
      this.definition.merge(definition);
      this.definition.compile();
      return new GraphQLFactoryLibrary(this.graphql, this.definition);
    }
  }]);
  return GraphQLFactory;
}();

var factory = function factory(graphql) {
  return new GraphQLFactory$1(graphql);
};

factory.constants = constants;
factory.compile = compile$1;
factory.utils = _$1;
factory.GraphQLFactoryDefinition = GraphQLFactoryDefinition;

/*
 * @module graphql-factory
 * @author Branden Horiuchi <bhoriuchi@gmail.com>
 * @description Create GraphQL schemas and types from JSON definitions
 *
 */

module.exports = factory;
