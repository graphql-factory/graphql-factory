'use strict';

var isArray = function isArray(obj) {
  return Array.isArray(obj);
};

isArray._accepts = ['ANY'];

var forEach = function forEach(obj, fn) {
  try {
    if (isArray(obj)) {
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
};

forEach._accepts = [Object, Array];

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var isObject = function isObject(obj) {
  return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null;
};

isObject._accepts = ['ANY'];

var isFunction = function isFunction(obj) {
  return typeof obj === 'function';
};

isFunction._accepts = ['ANY'];

var contains = function contains(list, obj) {
  return list.reduce(function (prev, cur) {
    return cur === obj && prev;
  }, false);
};

contains._accepts = [Array];

var isDate = function isDate(obj) {
  return obj instanceof Date;
};

isDate._accepts = ['ANY'];

var isHash = function isHash(obj) {
  return isObject(obj) && !isArray(obj) && !isDate(obj);
};

isHash._accepts = ['ANY'];
isHash._dependencies = ['dash.isArray', 'dash.isDate', 'dash.isObject'];

var includes = function includes(obj, key) {
  return isArray(obj) && obj.indexOf(key) !== -1;
};

includes._accepts = [Array];

/*
function _arrayMerge(target, source, seen) {
  forEach(source, function (val, i) {
    if (isArray(val) && !isArray(target[i])) target[i] = val;else if (target[i] !== undefined) _merge(target[i], val, clone(seen));else target.push(val);
  });
}

function _merge(target, source) {
  var seen = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

  if (includes(seen, source) || includes(seen, source)) return target;
  seen = seen.concat([target, source]);

  forEach(source, function (s, k) {
    var t = target[k];
    if (t === undefined && isHash(s)) target[k] = _merge({}, s, clone(seen));else if (isHash(t) && isHash(s)) target[k] = _merge(t, s, clone(seen));else if (isArray(s) && !isArray(t)) target[k] = s;else if (isArray(s)) forEach(s, function (val, i) {
      return _arrayMerge(t, s, seen);
    });else if (isDate(s)) target[k] = new Date(s);else target[k] = s;
  });
  return target;
}

var merge = function merge() {
  var args = [].concat(Array.prototype.slice.call(arguments));

  if (args.length === 0) return {};else if (args.length === 1) return args[0];else if (!isHash(args[0])) return {};

  var target = args[0];
  var sources = args.slice(1);

  forEach(sources, function (source) {
    if (isHash(source)) _merge(target, source);
  });
  return target;
};

merge._accepts = [Object];
merge._dependencies = ['dash.isArray', 'dash.isHash', 'dash.isDate', 'dash.forEach', 'dash.includes', 'dash.clone'];
*/

var map = function map(obj, fn) {
  var output = [];
  forEach(obj, function (v, k) {
    return output.push(fn(v, k));
  });
  return output;
};

map._accepts = [Object, Array];

var clone = function clone(obj) {
  var deep = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

  if (isArray(obj)) return deep ? map(obj, function (o) {
    return clone(o, true);
  }) : obj.slice(0);
  if (isHash(obj)) return deep ? merge({}, obj) : Object.assign({}, obj);
  if (isDate(obj) && deep) return new Date(obj);
  return obj;
};

clone._accepts = [Object, Array];
clone._dependencies = ['dash.isArray', 'dash.isHash', 'dash.isDate', 'dash.merge', 'dash.map'];

var circular = function circular(obj) {
  var value = arguments.length <= 1 || arguments[1] === undefined ? '[Circular]' : arguments[1];

  var circularEx = function circularEx(_obj) {
    var key = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
    var seen = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

    seen.push(_obj);
    if (isObject(_obj)) {
      forEach(_obj, function (o, i) {
        if (contains(seen, o)) _obj[i] = isFunction(value) ? value(_obj, key, clone(seen)) : value;else circularEx(o, i, clone(seen));
      });
    }
    return _obj;
  };

  if (!obj) throw new Error('circular requires an object to examine');
  return circularEx(obj, value);
};

circular._accepts = [Object, Array];
circular._dependencies = ['dash.forEach', 'dash.isObject', 'dash.isFunction', 'dash.contains', 'dash.clone'];

var ensureArray = function ensureArray(obj) {
  return !obj ? [] : isArray(obj) ? obj : [obj];
};

ensureArray._accepts = ['ANY'];

var filter = function filter(obj, fn) {
  var newObj = [];
  if (!isArray(obj)) return newObj;
  forEach(obj, function (v, k) {
    if (fn(v, k)) newObj.push(v);
  });
  return newObj;
};

filter._accepts = [Array];
filter._dependencies = ['dash.isArray', 'dash.forEach'];

var find = function find(obj, fn, def) {
  var found = def || null;
  forEach(obj, function (v, k) {
    if (fn(v, k)) {
      found = v;
      return false;
    }
  });
  return found;
};

find._accepts = [Object, Array];

var stringToPathArray = function stringToPathArray(pathString) {
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
};

stringToPathArray._accepts = [String];

var get$1 = function get(obj, path, defaultValue) {
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
};

get$1._accepts = [Object, Array];
get$1._dependencies = ['dash.isArray', 'dash.stringToPathArray'];

var has = function has(obj, path) {
  var found = true;
  var fields = isArray(path) ? path : stringToPathArray(path);
  if (!fields.length) return false;
  forEach(fields, function (field) {
    if (obj[field] === undefined) {
      found = false;
      return false;
    }
    obj = obj[field];
  });
  return found;
};

has._accepts = [Object, Array];
has._dependencies = ['dash.forEach', 'dash.isArray', 'dash.stringToPathArray'];

var intersection = function intersection() {
  var args = [].concat(Array.prototype.slice.call(arguments));
  if (!args.length) return [];

  return args.reduce(function (prev, cur) {
    if (!isArray(prev) || !isArray(cur)) return [];
    var left = new Set(prev);
    var right = new Set(cur);
    var i = [].concat(toConsumableArray(left)).filter(function (item) {
      return right.has(item);
    });
    return [].concat(toConsumableArray(i));
  }, args[0]);
};

intersection._accepts = [Array];

var isBoolean = function isBoolean(obj) {
  return obj === true || obj === false;
};

isBoolean._accepts = ['ANY'];

var isNumber = function isNumber(obj) {
  return typeof obj === 'number' && !isNaN(obj);
};

isNumber._accepts = ['ANY'];

var isPromise = function isPromise(obj) {
  return obj && isFunction(obj.then) && isFunction(obj.catch);
};

isPromise._accepts = ['ANY'];

var isString$1 = function isString(obj) {
  return typeof obj === 'string';
};

isString$1._accepts = ['ANY'];

var range = function range() {
  var number = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
  var increment = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

  return [].concat(toConsumableArray(Array(number).keys())).map(function (i) {
    return i * increment;
  });
};

range._accepts = [Number];

var keys = function keys(obj) {
  try {
    return isArray(obj) ? range(obj.length) : Object.keys(obj);
  } catch (err) {
    return [];
  }
};

keys._accepts = [Object, Array];
keys._dependencies = ['dash.isArray', 'dash.range'];

var mapValues = function mapValues(obj, fn) {
  var newObj = {};
  forEach(obj, function (v, k) {
    newObj[k] = fn(v);
  });
  return newObj;
};

mapValues._accepts = [Object, Array];

var mapWith = function mapWith(obj, fn) {
  var newObj = [];
  forEach(obj, function (v, k) {
    var value = fn(v, k);
    if (value !== undefined) newObj.push(value);
  });
  return newObj;
};

mapWith._accepts = [Object, Array];

var omitBy = function omitBy(obj, fn) {
  var newObj = {};
  if (!isHash(obj)) return newObj;
  forEach(obj, function (v, k) {
    if (!fn(v, k)) newObj[k] = v;
  });
  return newObj;
};

omitBy._accepts = [Object];
omitBy._dependencies = ['dash.isHash', 'dash.forEach'];

var pickBy = function pickBy(obj, fn) {
  var newObj = {};
  if (!isHash(obj)) return newObj;
  forEach(obj, function (v, k) {
    if (fn(v, k)) newObj[k] = v;
  });
  return newObj;
};

pickBy._accepts = [Object];
pickBy._dependencies = ['dash.isHash', 'dash.forEach'];

var pretty = function pretty(obj) {
  var space = arguments.length <= 1 || arguments[1] === undefined ? '  ' : arguments[1];

  try {
    return JSON.stringify(obj, null, space);
  } catch (err) {
    console.error(err);
    return '';
  }
};

pretty._accepts = [Object, Array, Date];

var set$1 = function set(obj, path, val) {
  var fields = isArray(path) ? path : stringToPathArray(path);

  forEach(fields, function (field, idx) {
    if (idx === fields.length - 1) obj[field] = val;else if (!obj[field]) obj[field] = isNumber(field) ? [] : {};
    obj = obj[field];
  });
};

set$1._accepts = [Object, Array];
set$1._dependencies = ['dash.isArray', 'dash.isNumber', 'dash.stringToPathArray', 'dash.forEach'];

var stringify = function stringify(obj) {
  try {
    if (isHash(obj) || isArray(obj)) return JSON.stringify(obj);else if (has(obj, 'toString')) return obj.toString();else return String(obj);
  } catch (err) {}
  return '';
};

stringify._accepts = ['ANY'];
stringify._dependencies = ['dash.has', 'dash.isArray', 'dash.isHash'];

var union = function union() {
  var args = [].concat(Array.prototype.slice.call(arguments));
  if (!args.length) return [];

  try {
    var u = args.reduce(function (prev, cur) {
      if (!isArray(prev) || !isArray(cur)) return [];
      return prev.concat(cur);
    }, []);

    return [].concat(toConsumableArray(new Set(u)));
  } catch (err) {
    console.error(err);
    return [];
  }
};

union._accepts = ['ANY'];

var uniq = function uniq(list) {
  return isArray(list) ? [].concat(toConsumableArray(new Set(list))) : [];
};

uniq._accepts = [Array];

var without = function without() {
  var output = [];
  var args = [].concat(Array.prototype.slice.call(arguments));
  if (args.length < 2) return args.length ? args[0] : [];
  var search = args.slice(1);

  forEach(args[0], function (val) {
    if (!includes(search, val)) output.push(val);
  });
  return output;
};

without._accepts = [Array];
without._dependencies = ['dash.forEach', 'dash.includes'];

var _dash = {
  circular: circular,
  contains: contains,
  ensureArray: ensureArray,
  filter: filter,
  find: find,
  forEach: forEach,
  get: get$1,
  has: has,
  includes: includes,
  intersection: intersection,
  isArray: isArray,
  isBoolean: isBoolean,
  isFunction: isFunction,
  isHash: isHash,
  isNumber: isNumber,
  isObject: isObject,
  isPromise: isPromise,
  isString: isString$1,
  keys: keys,
  map: map,
  mapValues: mapValues,
  mapWith: mapWith,
  omitBy: omitBy,
  pickBy: pickBy,
  pretty: pretty,
  range: range,
  set: set$1,
  stringify: stringify,
  union: union,
  uniq: uniq,
  without: without,
  clone: clone,
  stringToPathArray: stringToPathArray,
  isDate: isDate
};

var DashChain = function DashChain(obj) {
  this._value = obj;
};

DashChain.prototype.value = function () {
  return this._value;
};

var dash = function dash(obj) {
  return new DashChain(obj);
};

var _loop = function _loop(name) {
  var fn = _dash[name];
  dash[name] = fn;
  if (fn._chainable !== false) {
    DashChain.prototype[name] = function () {
      var args = [this._value].concat([].concat(Array.prototype.slice.call(arguments)));
      this._value = fn.apply(this, args);
      return fn._terminates == true ? this._value : this;
    };
  }
};

for (var name in _dash) {
  _loop(name);
}

module.exports = dash;