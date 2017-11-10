'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var EventEmitter = _interopDefault(require('events'));
var _ = _interopDefault(require('lodash'));
var Plugin = _interopDefault(require('graphql-factory-plugin'));
var graphql = require('graphql');

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









var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};





var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var LITERAL_RX = /^```([\w]+)```$/;
var DIRECTIVE_RX = /^@/;

/**
 * Determines if an object but not an array
 * @param obj
 * @returns {boolean}
 */
function isHash(obj) {
  return _.isObject(obj) && !_.isArray(obj);
}

/**
 * Gets the constructor name
 * @param obj
 */
function constructorName(obj) {
  return _.get(obj, 'constructor.name');
}

/**
 * Determines the type of a value and returns a
 * name with stringified value if able
 * @param obj
 * @returns {*}
 */
function getType(obj) {
  if (Array.isArray(obj)) {
    return ['array', obj];
  } else if (obj === 'undefined') {
    return ['undefined', 'undefined'];
  } else if (obj === null) {
    return ['null', 'null'];
  } else if (typeof obj === 'string') {
    // check for literal string which will be unquoted and
    // have the literal markers removed
    if (obj.match(LITERAL_RX)) {
      return ['literal', obj.replace(LITERAL_RX, '$1')];
    }
    return ['string', '"' + obj + '"'];
  } else if (typeof obj === 'number') {
    return String(obj).indexOf('.') !== -1 ? ['float', String(obj)] : ['int', String(obj)];
  } else if (typeof obj === 'boolean') {
    return ['boolean', String(obj)];
  } else if (obj instanceof Date) {
    return ['date', JSON.stringify(obj)];
  }
  return [typeof obj === 'undefined' ? 'undefined' : _typeof(obj), obj];
}

/**
 * Converts args to
 * @param obj
 * @param replaceBraces
 * @returns {undefined}
 */
function toArgs(obj) {
  var replaceBraces = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  var _getType = getType(obj),
      _getType2 = slicedToArray(_getType, 2),
      type = _getType2[0],
      value = _getType2[1];

  var result = void 0;
  switch (type) {
    case 'undefined':
      break;
    case 'array':
      result = '[' + _.map(value, function (v) {
        return toArgs(v);
      }).join(', ') + ']';
      break;
    case 'object':
      result = '{' + _.map(value, function (v, k) {
        return k + ': ' + toArgs(v);
      }).join(', ') + '}';
      break;
    default:
      result = value;
      break;
  }

  return replaceBraces ? result.replace(/^[{[]([\S\s]+)[}\]]$/, '$1') : result;
}

/**
 * Gets a string of directives
 * @param directives
 * @param reason
 * @returns {*}
 */
function getDirectives(definition, reason) {
  var directives = {};

  _.forEach(definition, function (value, key) {
    if (key.match(DIRECTIVE_RX)) {
      directives[key] = value;
    }
  });

  if (_.isString(reason)) directives.deprecated = { reason: reason };
  if (!_.keys(directives).length) return '';

  return ' ' + _.map(directives, function (value, name) {
    return !isHash(value) ? '' + name : name + '(' + toArgs(value, true) + ')';
  }).join(' ');
}

/**
 * Returns the appropriate definition key to store the
 * definition in
 * @param kind
 * @returns {*}
 */
function definitionKey(kind) {
  switch (kind) {
    case graphql.Kind.SCHEMA_DEFINITION:
      return 'schemas';
    case graphql.Kind.DIRECTIVE_DEFINITION:
      return 'directives';
    case graphql.Kind.TYPE_EXTENSION_DEFINITION:
      return 'extensions';
    case graphql.Kind.SCALAR_TYPE_DEFINITION:
    case graphql.Kind.OBJECT_TYPE_DEFINITION:
    case graphql.Kind.INPUT_OBJECT_TYPE_DEFINITION:
    case graphql.Kind.ENUM_TYPE_DEFINITION:
    case graphql.Kind.UNION_TYPE_DEFINITION:
    case graphql.Kind.INTERFACE_TYPE_DEFINITION:
      return 'types';
    case 'Function':
      return 'functions';
    default:
      return null;
  }
}

/*
export function inspect (obj) {
  console.log('<!-- INSPECTING\n\n')
  _.forEach(obj, (v, k) => {
    console.log(k, ':', v)
  })
  console.log('\n\n/INSPECTING -->\n\n')
}

export function pretty (obj) {
  console.log(JSON.stringify(obj, null, '  '))
}
*/

function indent() {
  var count = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
  var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '  ';

  return new Array(count).fill(value).join('');
}

function stringValue(str) {
  return _.isString(str) && str !== '';
}

/**
 * List of invalid function names to register
 * Invalid because they can be the field name and prone to duplicate
 * @type {[string,string,string,string,string,string,string]}
 */

var ENUM_RESERVED = ['hasKey', 'hasValue', '_keys', '_values'];

/**
 * Enum class, creates an enum with values passed in the config
 * and errors when they dont exists or modification is attempted
 * also provides a hasValue method for checking existence of value
 */
var Enum = function Enum(config) {
  var _this = this;

  classCallCheck(this, Enum);

  var error = null;
  this._keys = [];
  this._values = [];

  /**
   * Determines if the value exists without throwing an error
   * @param value
   * @returns {boolean}
   */
  this.hasValue = function (value) {
    return _this._values.indexOf(value) !== -1;
  };

  /**
   * Determines if the key exists
   * @param key
   * @returns {boolean}
   */
  this.hasKey = function (key) {
    return _this._keys.indexOf(key) !== -1;
  };

  var _config = !_.isArray(config) ? config : _.reduce(config, function (accum, item) {
    accum[item] = item;
    return accum;
  });

  // try to add each key/value
  _.forEach(_config, function (value, key) {
    if (_this.hasKey(key)) {
      error = new Error('NewEnumError: Duplicate Enum key "' + key + '"');
      return false;
    } else if (_this.hasValue(value)) {
      error = new Error('NewEnumError: Duplicate Enum value ' + value);
      return false;
    } else if (ENUM_RESERVED.indexOf(key) !== -1) {
      error = new Error('NewEnumError: Enum key "' + key + '" is reserved and cannot be used');
      return false;
    }

    _this._keys.push(key);
    _this._values.push(value);
    _this[key] = value;
  });

  // throw the error if encountered
  if (error) throw error;

  // return a proxy to this class which allows readonly functionality
  // and error throwing
  return new Proxy(this, {
    get: function get$$1(target, key) {
      if (!_.has(target, [key])) {
        throw new Error('Invalid Enum value ' + key);
      }
      return target[key];
    },
    set: function set$$1() {
      throw new Error('Enum type cannot be modified');
    },
    has: function has(target, key) {
      return _.has(target, key);
    },
    deleteProperty: function deleteProperty() {
      throw new Error('Enum type cannot be modified');
    },
    defineProperty: function defineProperty$$1() {
      throw new Error('Enum type cannot be modified');
    }
  });
};

// middleware types
var MiddlewareTypes = new Enum({
  BEFORE: 'before',
  AFTER: 'after',
  ERROR: 'error',
  RESOLVE: 'resolve'
});

// schema operations
var SchemaOperations = new Enum({
  QUERY: 'query',
  MUTATION: 'mutation',
  SUBSCRIPTION: 'subscription'
});

// events
var EventTypes = new Enum({
  REQUEST: 'request',
  FATAL: 'fatal',
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace'
});

// option defaults and constants
var DEFAULT_MIDDLEWARE_TIMEOUT = 300000; // 5 minutes

var DIRECTIVE_KEY = '@directives';

/**
 * Middleware class
 */

var GraphQLFactoryMiddleware = function GraphQLFactoryMiddleware(type, resolve, options) {
  classCallCheck(this, GraphQLFactoryMiddleware);

  var _ref = _.isObject(options) && options !== null ? options : {},
      timeout = _ref.timeout,
      name = _ref.name;

  if (!MiddlewareTypes.hasValue(type)) {
    throw new Error('GraphQLFactoryMiddlewareError: ' + 'Invalid middleware type "' + type + '"');
  } else if (!_.isFunction(resolve)) {
    throw new Error('GraphQLFactoryMiddlewareError: ' + 'resolve must be a function');
  } else if (timeout && (!_.isNumber(timeout) || timeout < 0)) {
    throw new Error('GraphQLFactoryMiddlewareError: ' + 'Timeout must be an integer greater than or equal to 0');
  }
  this.type = type;
  this.resolve = resolve;
  this.name = _.isString(name) && name !== '' ? name : null;
  this.identifier = this.name || _.get(resolve, 'name') || type;

  this.timeout = _.isNumber(timeout) ? Math.floor(timeout) : DEFAULT_MIDDLEWARE_TIMEOUT;
};

/**
 * Function to determine if the value can be cast as middleware
 * @param middleware
 * @returns {boolean}
 */


GraphQLFactoryMiddleware.canCast = function (middleware) {
  return _.isFunction(middleware) || middleware instanceof GraphQLFactoryMiddleware || isHash(middleware) && _.has(middleware, 'resolve');
};

/**
 * Function to cast a value to middleware
 * @param middleware
 * @param type
 * @param options
 * @returns {GraphQLFactoryMiddleware}
 */
GraphQLFactoryMiddleware.cast = function (type, middleware, options) {
  if (middleware instanceof GraphQLFactoryMiddleware) {
    if (MiddlewareTypes.hasValue(type)) middleware.type = type;
    if (isHash(options) && _.keys(options).length) middleware.options = options;
    return middleware;
  } else if (_.isFunction(middleware)) {
    return new GraphQLFactoryMiddleware(type, middleware, options);
  } else if (isHash(middleware) && _.has(middleware, 'resolve')) {
    var resolve = middleware.resolve,
        name = middleware.name,
        timeout = middleware.timeout;

    return new GraphQLFactoryMiddleware(type, resolve, { name: name, timeout: timeout });
  }

  throw new Error('Cannot cast middleware, must be Function or Middleware');
};

/**
 * Middleware processing function
 * @param schema
 * @param backing
 * @param definition
 * @param params
 */
function processMiddleware(schema, backing, definition, params) {
  // const [ source, args, context, info ] = params
  // const { parentType, fieldName } = info
  // console.log(parentType._fields[fieldName])
  // console.log(info.schema._factory)

  // nonsense for temporary lint pass
  if (schema === 1) return { backing: backing, definition: definition, params: params };
  throw new Error('AHH!');
}

/**
 * A backing is an object that stores functions and
 * other data related to values that cannot be represented
 * in schema language
 *
 * Example backing structure after build
 *
 * const backing = {
 *   Foo: {
 *     _isTypeOf: Function,
 *     bar: {
 *       resolve: Function | Middleware,
 *       before: Function | Middleware,
 *       after: Function | Middleware,
 *       error: Function | Middleware
 *     }
 *   },
 *   '@directives': {
 *      directiveName: {
 *       before: Function | Middleware,
 *       after: Function | Middleware,
 *       error: Function | Middleware
 *     },
 *     ...
 *   }
 * }
 *
 */
// middleware helper methods
var cast = GraphQLFactoryMiddleware.cast;
var canCast = GraphQLFactoryMiddleware.canCast;

/**
 * Creates a middleware function from the field resolve
 * @param resolver
 * @returns {Function}
 */

function resolverMiddleware(resolver) {
  return function (req, res, next) {
    try {
      var source = req.source,
          args = req.args,
          context = req.context,
          info = req.info;

      var nonCircularReq = _.omit(req, ['context']);
      var ctx = _.assign({}, context, { req: nonCircularReq, res: res, next: next });
      var value = resolver(source, args, ctx, info);

      // return a resolved promise
      return Promise.resolve(value).then(function (result) {
        req.result = result;
        return next();
      }).catch(next);
    } catch (err) {
      return next(err);
    }
  };
}

/**
 * Adds a type function to the backing
 * @param typeName
 * @param funcName
 * @param func
 * @returns {addTypeFunction}
 */
function addTypeFunction(typeName, funcName, func) {
  if (!stringValue(typeName)) {
    throw new Error('Invalid "typeName" argument, must be String');
  } else if (!_.isFunction(func) && !stringValue(func)) {
    throw new Error('Invalid func argument, must be function');
  }
  _.set(this.backing, [typeName, '_' + funcName], func);
  return this;
}

/**
 * Backing for things that use middleware
 */
var DirectiveBacking = function () {
  function DirectiveBacking(backing) {
    classCallCheck(this, DirectiveBacking);

    this.backing = backing;
  }

  /**
   * Sets before middleware backing on directive
   * @param name
   * @param middleware
   */


  createClass(DirectiveBacking, [{
    key: 'before',
    value: function before(name, middleware) {
      var mw = cast(middleware);
      var path = [DIRECTIVE_KEY, name, MiddlewareTypes.BEFORE];
      _.set(this.backing, path, mw);
    }

    /**
     * Sets after middleware backing on directive
     * @param name
     * @param middleware
     */

  }, {
    key: 'after',
    value: function after(name, middleware) {
      var mw = cast(middleware);
      var path = [DIRECTIVE_KEY, name, MiddlewareTypes.AFTER];
      _.set(this.backing, path, mw);
    }

    /**
     * Sets error middleware backing on directive
     * @param name
     * @param middleware
     */

  }, {
    key: 'error',
    value: function error(name, middleware) {
      var mw = cast(middleware);
      var path = [DIRECTIVE_KEY, name, MiddlewareTypes.ERROR];
      _.set(this.backing, path, mw);
    }
  }]);
  return DirectiveBacking;
}();

/**
 * Backing for things that have resolve functions
 */

var ResolveBacking = function () {
  function ResolveBacking(backing) {
    classCallCheck(this, ResolveBacking);

    this.backing = backing;
  }

  /**
   * Adds a resolve function to the backing
   * @param typeName
   * @param fieldName
   * @param resolve
   * @returns {GraphQLFactoryBacking}
   */


  createClass(ResolveBacking, [{
    key: 'resolve',
    value: function resolve(typeName, fieldName, _resolve) {
      if (!stringValue(typeName)) {
        throw new Error('Missing required argument "typeName"');
      } else if (!stringValue(typeName)) {
        throw new Error('Missing required argument "fieldName"');
      } else if (!_.isFunction(_resolve) && !stringValue(_resolve)) {
        throw new Error('Invalid "resolve" argument, must be function');
      }
      _.set(this.backing, [typeName, fieldName, 'resolve'], _resolve);
      return this;
    }
  }]);
  return ResolveBacking;
}();

var ScalarBacking = function () {
  function ScalarBacking(backing) {
    classCallCheck(this, ScalarBacking);

    this.backing = isHash(backing) ? backing : {};
  }

  /**
   * adds a serialize function
   * @param type
   * @param func
   * @returns {*}
   */


  createClass(ScalarBacking, [{
    key: 'serialize',
    value: function serialize(type, func) {
      return addTypeFunction.call(this, type, 'serialize', func);
    }

    /**
     * adds a parseValue function
     * @param type
     * @param func
     * @returns {*}
     */

  }, {
    key: 'parseValue',
    value: function parseValue(type, func) {
      return addTypeFunction.call(this, type, 'parseValue', func);
    }

    /**
     * adds a parseLiteral function
     * @param type
     * @param func
     * @returns {*}
     */

  }, {
    key: 'parseLiteral',
    value: function parseLiteral(type, func) {
      return addTypeFunction.call(this, type, 'parseLiteral', func);
    }
  }]);
  return ScalarBacking;
}();

/**
 * Builds an object backing
 * supports field level middleware
 */
var ObjectBacking = function (_ResolveBacking) {
  inherits(ObjectBacking, _ResolveBacking);

  function ObjectBacking(backing) {
    classCallCheck(this, ObjectBacking);
    return possibleConstructorReturn(this, (ObjectBacking.__proto__ || Object.getPrototypeOf(ObjectBacking)).call(this, backing));
  }

  /**
   * Adds isTypeOf
   * @param type
   * @param func
   */


  createClass(ObjectBacking, [{
    key: 'isTypeOf',
    value: function isTypeOf(type, func) {
      return addTypeFunction.call(this, type, 'isTypeOf', func);
    }
  }]);
  return ObjectBacking;
}(ResolveBacking);

/**
 * Builds an interface backing
 * supports field level middleware
 */
var InterfaceBacking = function (_ResolveBacking2) {
  inherits(InterfaceBacking, _ResolveBacking2);

  function InterfaceBacking(backing) {
    classCallCheck(this, InterfaceBacking);
    return possibleConstructorReturn(this, (InterfaceBacking.__proto__ || Object.getPrototypeOf(InterfaceBacking)).call(this, backing));
  }

  /**
   * adds a resolveType function
   * @param type
   * @param func
   */


  createClass(InterfaceBacking, [{
    key: 'resolveType',
    value: function resolveType(type, func) {
      return addTypeFunction.call(this, type, 'resolveType', func);
    }
  }]);
  return InterfaceBacking;
}(ResolveBacking);

/**
 * Builds a Union backing
 */
var UnionBacking = function () {
  function UnionBacking(backing) {
    classCallCheck(this, UnionBacking);

    this.backing = isHash(backing) ? backing : {};
  }

  /**
   * adds a resolveType function
   * @param type
   * @param func
   */


  createClass(UnionBacking, [{
    key: 'resolveType',
    value: function resolveType(type, func) {
      return addTypeFunction.call(this, type, 'resolveType', func);
    }
  }]);
  return UnionBacking;
}();

/**
 * Entry point for building a backing
 */

var GraphQLFactoryBacking = function () {
  function GraphQLFactoryBacking(backing) {
    classCallCheck(this, GraphQLFactoryBacking);

    this.backing = isHash(backing) ? backing : {};
  }

  /**
   * Merge another backing into this one
   * @param backing
   */


  createClass(GraphQLFactoryBacking, [{
    key: 'merge',
    value: function merge(backing) {
      var _backing = backing instanceof GraphQLFactoryBacking ? backing.backing : backing;
      _.assign(this.backing, _backing);
      return this;
    }

    /**
     * Hydrates the schema with the current backing which contains
     * things that cannot be expressed in the schema language
     * @param schema
     * @param definition
     * @returns {*}
     */

  }, {
    key: 'hydrateSchema',
    value: function hydrateSchema(schema, definition) {
      var _this3 = this;

      var err = null;
      var backing = this;

      // get the type backing
      var backingTypes = _.omit(this.backing, [DIRECTIVE_KEY]);

      // set the functions from the function map
      _.forEach(backingTypes, function (typeBacking, typeName) {
        if (err) return false;

        // get the type and validate that the type backing is a hash
        var type = _.get(schema, ['_typeMap', typeName]);
        if (!type || !isHash(typeBacking) || !_.keys(typeBacking).length) {
          return true;
        }

        // hydrate the types
        _.forEach(typeBacking, function (value, key) {
          if (err) return false;

          // catch any errors. these will most likely be function lookup errors
          try {
            if (key.match(/^_/)) {
              var path = [key.replace(/^_/, '')];
              var infoPath = typeName + '.' + path[0];
              var func = definition.lookupFunction(value, infoPath);

              // wrap the function and add a context
              // then hydrate the type
              _.set(type, path, function () {
                var context = _.assign({}, definition.context);

                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                  args[_key] = arguments[_key];
                }

                return func.apply(context, args);
              });
            } else if (_.isString(value) || canCast(value)) {
              var resolvePath = ['_fields', key, 'resolve'];
              var factoryPath = ['_fields', key, '_factory', 'resolve'];
              var _infoPath = typeName + '.' + key + '.resolve';
              var resolver = value instanceof GraphQLFactoryMiddleware ? value : _.isString(value) || _.isFunction(value) ? resolverMiddleware(definition.lookupFunction(value, _infoPath)) : value;

              // cast the middleware
              var resolveMiddleware = cast(MiddlewareTypes.RESOLVE, resolver);

              // set the resolve middleware on the factory extension
              _.set(type, factoryPath, resolveMiddleware);

              // finally hydrate the resolve with the proxy
              _.set(type, resolvePath, function resolve() {
                for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                  args[_key2] = arguments[_key2];
                }

                return processMiddleware(schema, backing, definition, args);
              });
            } else {
              throw new Error('Invalid Backing at "' + typeName + '.' + key + '", should be ' + 'Function or Object but found ' + (typeof value === 'undefined' ? 'undefined' : _typeof(value)));
            }
          } catch (backingError) {
            err = backingError;
            return false;
          }
        });
      });

      // hydrate/extend the directives
      _.forEach(schema._directives, function (directive) {
        var directivePath = [DIRECTIVE_KEY, directive.name];

        var _$get = _.get(_this3.backing, directivePath, {}),
            _before = _$get._before,
            _after = _$get._after,
            _error = _$get._error;

        if (_before) directive._before = _before;
        if (_after) directive._after = _after;
        if (_error) directive._error = _error;
      });

      // check for merge errors
      if (err) throw err;

      // otherwise return the hydrated schema
      return schema;
    }

    /**
     * Starts a new Directive backing
     * @returns {DirectiveBacking}
     * @constructor
     */

  }, {
    key: 'Directive',
    value: function Directive(name, directive) {
      _.set(this.backing, [DIRECTIVE_KEY, name], directive);
    }

    /**
     * Start a new Scalar backing
     * @returns {ScalarBacking}
     * @constructor
     */

  }, {
    key: 'Scalar',
    get: function get$$1() {
      return new ScalarBacking(this.backing);
    }

    /**
     * Start a new Object backing
     * @returns {ObjectBacking}
     * @constructor
     */

  }, {
    key: 'Object',
    get: function get$$1() {
      return new ObjectBacking(this.backing);
    }

    /**
     * Start a new Interface backing
     * @returns {InterfaceBacking}
     * @constructor
     */

  }, {
    key: 'Interface',
    get: function get$$1() {
      return new InterfaceBacking(this.backing);
    }

    /**
     * Start a new Union backing
     * @returns {UnionBacking}
     * @constructor
     */

  }, {
    key: 'Union',
    get: function get$$1() {
      return new UnionBacking(this.backing);
    }
  }]);
  return GraphQLFactoryBacking;
}();

/**
 * Creates a new GraphQLDirective and adds
 * middleware properties to it before returning
 */
var cast$1 = GraphQLFactoryMiddleware.cast;

var TYPES = MiddlewareTypes._values.filter(function (value) {
  return value !== MiddlewareTypes.RESOLVE;
});

var GraphQLFactoryDirective = function GraphQLFactoryDirective(config) {
  classCallCheck(this, GraphQLFactoryDirective);

  // create a directive
  var directive = new graphql.GraphQLDirective(config);

  // loop through the types and try to add the directive
  // if it is defined
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = TYPES[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var type = _step.value;

      var mw = config[type];
      if (mw) {
        directive['_' + type] = cast$1(type, mw);
      }
    }

    // return the modified directive
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

  return directive;
};

var buildSchema$1 = graphql.buildSchema;

var GraphQLFactorySchema = function () {
  function GraphQLFactorySchema(schemaDefinition, nameDefault) {
    classCallCheck(this, GraphQLFactorySchema);
    var name = schemaDefinition.name,
        query = schemaDefinition.query,
        mutation = schemaDefinition.mutation,
        subscription = schemaDefinition.subscription,
        description = schemaDefinition.description,
        directives = schemaDefinition.directives;


    this._definition = schemaDefinition;
    this._description = description;
    this._rootTypes = {};
    this._backing = new GraphQLFactoryBacking(); // local backing
    this._directives = _.isArray(directives) ? directives : [];
    this._types = {};
    this.name = name || nameDefault;
    this.query = this._addRootType(SchemaOperations.QUERY, query);
    this.mutation = this._addRootType(SchemaOperations.MUTATION, mutation);
    this.subscription = this._addRootType(SchemaOperations.SUBSCRIPTION, subscription);
  }

  /**
   * add the root type to the schema context if it is defined
   * on the schema. Otherwise add the name of the rootType
   * @param type
   * @param value
   * @returns {*}
   * @private
   */


  createClass(GraphQLFactorySchema, [{
    key: '_addRootType',
    value: function _addRootType(type, value) {
      if (_.isObject(value) && !_.isArray(value)) {
        var name = value.name;

        var _name = name || _.capitalize(type);
        this._rootTypes[_name] = new GraphQLFactoryDefinitionTranslator().translateType(value, _name, this._backing);
        return _name;
      } else if (_.isString(value)) {
        return value;
      }
      return null;
    }

    /**
     * Creates a complete schema definition
     * @param types
     * @returns {string|*}
     */

  }, {
    key: 'export',
    value: function _export(definition) {
      if (!isHash(definition)) throw new Error('ExportError: Invalid definition');

      // deconstruct the definition
      var _types = definition.types,
          _directives = definition.directives,
          _backing = definition.backing;

      // create a new backing and merge the existing

      var backing = new GraphQLFactoryBacking().merge(_backing).merge(this._backing);

      // merge the types
      var types = _.assign({}, _types, this._rootTypes);

      // reduce the directives to the required ones
      var directives = _.reduce(_.uniq(this._directives), function (directiveList, directive) {
        if (_.has(_directives, [directive])) {
          directiveList.push(_directives[directive]);
        }
        return directiveList;
      }, []);

      // create the document
      var document = _.values(types).concat(directives).concat(this.definition).join('\n');

      // "export" the document and backing
      return { document: document, backing: backing };
    }

    /**
     * Builds a schema
     * @param definition
     */

  }, {
    key: 'build',
    value: function build(definition) {
      // export the document
      var _export2 = this.export(definition),
          document = _export2.document,
          backing = _export2.backing;

      // create a schema object from the document


      var schema = buildSchema$1(document);

      // merge the definition backing with the local
      // and hydrate the schema with it
      return backing.hydrateSchema(schema, definition);
    }

    /**
     * Generates the schema definition
     * @returns {string}
     */

  }, {
    key: 'definition',
    get: function get$$1() {
      var _this = this;

      var _directives = getDirectives(this._definition);
      var ops = _.reduce(SchemaOperations._values, function (accum, operation) {
        if (_this[operation]) {
          accum.push('  ' + operation + ': ' + _this[operation]);
        }
        return accum;
      }, []);
      var def = 'schema' + _directives + ' {\n' + ops.join('\n') + '\n}\n';

      return _.isString(this._definition) ? '# ' + this._definition : def;
    }
  }]);
  return GraphQLFactorySchema;
}();

/**
 * This module converts graphql factory definitions
 * into schema language + a backing
 */
var GraphQLFactoryDefinitionTranslator = function () {
  function GraphQLFactoryDefinitionTranslator() {
    classCallCheck(this, GraphQLFactoryDefinitionTranslator);

    this.definition = new GraphQLFactoryDefinition();
  }

  /**
   * generic type composer
   * @param typeDef
   * @param typeName
   * @returns {string}
   * @private
   */


  createClass(GraphQLFactoryDefinitionTranslator, [{
    key: '_type',
    value: function _type(typeDef, typeName) {
      var name = typeDef.name,
          type = typeDef.type,
          description = typeDef.description;


      var parts = {
        name: name || typeName,
        directives: getDirectives(typeDef)
      };

      var def = this['_' + (type || 'Object')](typeDef, parts);

      return _.isString(description) ? '# ' + description + '\n' + def : def;
    }

    /**
     * Adds a backing function
     * @param typeDef
     * @param typeName
     * @param fnName
     * @private
     */

  }, {
    key: '_registerFunction',
    value: function _registerFunction(typeDef, typeName, fnName) {
      var type = typeDef.type || 'Object';
      var fn = _.get(typeDef, [fnName]);
      if (_.isFunction(fn) || _.isString(fn)) {
        this.definition.backing[type][fnName](typeName, fn);
      }
    }

    /**
     * Creates a directive
     * @private
     */

  }, {
    key: '_Directive',
    value: function _Directive(definition, directiveName) {
      var name = definition.name,
          description = definition.description,
          locations = definition.locations,
          args = definition.args,
          before = definition.before,
          after = definition.after,
          error = definition.error;

      var _name = name || directiveName;
      var _args = this._arguments(args, 1);
      var _locations = _.filter(locations, _.isString);
      var _loc = _locations.length ? _locations.join(' | ') : _.map(graphql.DirectiveLocation).join(' | ');

      // add the custom object as a directive backing
      this.definition.backing.Directive(_name, new GraphQLFactoryDirective({
        name: _name,
        description: description,
        locations: locations || _.values(graphql.DirectiveLocation),
        before: before,
        after: after,
        error: error
      }));

      // build the directive string
      var directive = 'directive @' + _name + _args + ' on ' + _loc + '\n';

      // return the schema definition
      return _.isString(description) ? '# ' + description + '\n' + directive : directive;
    }

    /**
     * Creates a union
     * @param typeDef
     * @param name
     * @param directives
     * @returns {string}
     * @private
     */

  }, {
    key: '_Union',
    value: function _Union(typeDef, _ref) {
      var name = _ref.name;

      this._registerFunction(typeDef, name, 'resolveType');
      var types = typeDef.types;

      var _types = _.isFunction(types) ? types() : types;
      return 'union ' + name + ' = ' + _types.join(' | ') + '\n';
    }

    /**
     * creates a scalar
     * @param typeDef
     * @param name
     * @param directives
     * @returns {string}
     * @private
     */

  }, {
    key: '_Scalar',
    value: function _Scalar(typeDef, _ref2) {
      var name = _ref2.name,
          directives = _ref2.directives;

      this._registerFunction(typeDef, name, 'serialize');
      this._registerFunction(typeDef, name, 'parseValue');
      this._registerFunction(typeDef, name, 'parseLiteral');
      return 'scalar ' + name + directives + '\n';
    }

    /**
     * Creates an enum
     * @param values
     * @param name
     * @param directives
     * @returns {string}
     * @private
     */

  }, {
    key: '_Enum',
    value: function _Enum(_ref3, _ref4) {
      var values = _ref3.values;
      var name = _ref4.name,
          directives = _ref4.directives;

      var _values = this._values(values);
      return 'enum ' + name + directives + ' {\n' + _values + '\n}\n';
    }

    /**
     * Create input def
     * @param typeDef
     * @param name
     * @param directives
     * @returns {string}
     * @private
     */

  }, {
    key: '_Input',
    value: function _Input(typeDef, _ref5) {
      var name = _ref5.name,
          directives = _ref5.directives;

      var fields = this._fields(typeDef);
      return 'input ' + name + directives + ' {\n' + fields + '\n}\n';
    }

    /**
     * Create an object def
     * @param typeDef
     * @param name
     * @param directives
     * @returns {string}
     * @private
     */

  }, {
    key: '_Object',
    value: function _Object(typeDef, _ref6) {
      var name = _ref6.name,
          directives = _ref6.directives;

      this._registerFunction(typeDef, name, 'isTypeOf');
      var interfaces = typeDef.interfaces;

      var fields = this._fields(typeDef, name);
      var _interfaces = _.isFunction(interfaces) ? interfaces() : interfaces;
      var _iface = _.isArray(_interfaces) && _interfaces.length ? ' implements ' + _iface.join(', ') : '';
      return 'type ' + name + _iface + directives + ' {\n' + fields + '\n}\n';
    }

    /**
     * Create an interface def
     * @param typeDef
     * @param name
     * @param directives
     * @returns {string}
     * @private
     */

  }, {
    key: '_Interface',
    value: function _Interface(typeDef, _ref7) {
      var name = _ref7.name,
          directives = _ref7.directives;

      this._registerFunction(typeDef, name, 'resolveType');
      var fields = this._fields(typeDef, name);
      return 'interface ' + name + directives + ' {\n' + fields + '\n}\n';
    }

    /**
     * Process subfields
     * @param parentType
     * @param fields
     * @param parent
     * @returns {string|*}
     * @private
     */

  }, {
    key: '_fields',
    value: function _fields(_ref8, parent) {
      var parentType = _ref8.type,
          fields = _ref8.fields;

      var _this = this;

      var tabs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

      var _parentType = parentType || 'Object';
      return _.map(fields, function (def, name) {
        var definition = isHash(def) ? _parentType === 'input' ? _.omit(def, ['args', 'resolve', 'deprecationReason']) : _.omit(def, ['defaultValue']) : { type: def };
        var type = definition.type,
            args = definition.args,
            resolve = definition.resolve,
            deprecationReason = definition.deprecationReason,
            description = definition.description,
            defaultValue = definition.defaultValue;

        // add resolve backing

        if (_.isFunction(resolve) || stringValue(resolve)) {
          _this.definition.backing[_parentType].resolve(parent, name, resolve);
        }

        var _directives = getDirectives(definition, deprecationReason);
        var _default = defaultValue !== undefined ? ' = ' + toArgs(defaultValue, true) : '';
        var _args = _this._arguments(args);
        var field = '' + indent(tabs) + name + _args + ': ' + type + _default + _directives;

        return _.isString(description) ? indent(tabs) + '# ' + description + '\n' + field : field;
      }).join('\n');
    }

    /**
     * Process arguments
     * @param args
     * @returns {*}
     * @private
     */

  }, {
    key: '_arguments',
    value: function _arguments(args) {
      var tabs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;

      if (!args || !_.keys(args).length) return '';
      var _args = _.map(args, function (arg, name) {
        var definition = isHash(arg) ? arg : { type: arg };
        var type = definition.type,
            defaultValue = definition.defaultValue,
            description = definition.description;

        var _directives = getDirectives(definition);
        var _default = defaultValue === undefined ? '' : ' = ' + toArgs(defaultValue);
        var a = '' + indent(tabs) + name + ': ' + type + _default + _directives;
        return _.isString(description) ? indent(tabs) + '# ' + description + '\n' + a : a;
      }).join(',\n');
      return '(\n' + _args + '\n  )';
    }

    /**
     * Generates values for an enum
     * @param values
     * @returns {string|*}
     * @private
     */

  }, {
    key: '_values',
    value: function _values(values) {
      var tabs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

      return _.map(values, function (def, name) {
        var definition = isHash(def) ? def : {};
        var deprecationReason = definition.deprecationReason,
            description = definition.description;

        var _directives = getDirectives(definition, deprecationReason);
        var v = '' + indent(tabs) + name + _directives;
        return _.isString(description) ? indent(tabs) + '# ' + description + '\n' + v : v;
      }).join('\n');
    }

    /**
     * Translate a single type and return its value
     * @param typeDef
     */

  }, {
    key: 'translateType',
    value: function translateType(typeDef, typeName, backing) {
      // re-point the function map
      if (backing instanceof GraphQLFactoryBacking) this.definition.backing = backing;else if (isHash(backing)) this.definition.backing = new GraphQLFactoryBacking(backing);
      return this._type(typeDef, typeName);
    }

    /**
     * Translates the factory definition
     * @param factoryDefinition
     */

  }, {
    key: 'translate',
    value: function translate(factoryDefinition) {
      var _this2 = this;

      _.forEach(factoryDefinition, function (store, storeType) {
        switch (storeType) {
          case 'backing':
            _this2.definition.backing.merge(store);
            break;

          case 'functions':
          case 'context':
            _.assign(_this2.definition[storeType], store);
            break;

          case 'before':
          case 'after':
          case 'error':
            _this2.definition[storeType] = store.slice();
            break;

          case 'types':
            _.forEach(store, function (typeDef, typeName) {
              _this2.definition.addKind(graphql.Kind.OBJECT_TYPE_DEFINITION, _.get(typeDef, 'name', typeName), _this2._type(typeDef, typeName));
            });
            break;

          case 'schemas':
            _.forEach(store, function (schemaDef, schemaName) {
              _this2.definition.addKind(graphql.Kind.SCHEMA_DEFINITION, _.get(schemaDef, 'name', schemaName), new GraphQLFactorySchema(schemaDef, schemaName));
            });
            break;

          case 'directives':
            _.forEach(store, function (directiveDef, directiveName) {
              _this2.definition.addKind(graphql.Kind.DIRECTIVE_DEFINITION, _.get(directiveDef, 'name', directiveName), _this2._Directive(directiveDef, directiveName));
            });
            break;

          default:
            break;
        }
      });

      return this.definition;
    }
  }]);
  return GraphQLFactoryDefinitionTranslator;
}();

var CAN_MERGE = ['context', 'types', 'schemas', 'functions', 'plugins', 'directives', 'warnings'];

var GraphQLFactoryDefinition = function () {
  function GraphQLFactoryDefinition(factory) {
    classCallCheck(this, GraphQLFactoryDefinition);

    this.factory = factory;
    this.backing = new GraphQLFactoryBacking();
    this.context = {};
    this.types = {};
    this.schemas = {};
    this.functions = {};
    this.plugins = {};
    this.directives = {};
    this.error = null;
    this.warnings = [];
  }

  /**
   * adds definition fragments to the definition
   * @param args
   */


  createClass(GraphQLFactoryDefinition, [{
    key: 'use',
    value: function use() {
      if (!arguments.length) throw new Error('use requires at least 1 argument');
      var arg0 = arguments.length <= 0 ? undefined : arguments[0];
      switch (constructorName(arg0)) {
        case 'String':
          this._processDefinition.apply(this, arguments);
          break;

        case 'Function':
          this._processFunction.apply(this, arguments);
          break;

        case 'Object':
        case 'GraphQLFactoryDefinition':
          this._processFactoryDefinition.apply(this, arguments);
          break;

        default:
          // check for plugin
          if (arg0 instanceof Plugin || _.isFunction(_.get(arg0, 'install'))) {
            this._processPlugin.apply(this, arguments);
          } else {
            throw new Error('Unable to process use value');
          }
          break;
      }

      // check for error which can be set by private methods
      if (this.error instanceof Error) {
        throw this.error;
      }

      return this;
    }

    /**
     * Builds a registry
     * @param options
     */

  }, {
    key: 'build',
    value: function build() {
      var _this = this;

      return _.reduce(this.schemas, function (registry, schema, name) {
        registry[name] = schema.build(_this);
        return registry;
      }, {});
    }

    /**
     * Merges the merge-able fields
     * @param definition
     * @returns {GraphQLFactoryDefinition}
     */

  }, {
    key: 'merge',
    value: function merge(definition) {
      var _this2 = this;

      // merge the backing
      this.backing.merge(definition.backing);

      // merge the rest
      _.forEach(CAN_MERGE, function (key) {
        var target = _this2[key];
        var source = definition[key];
        if (_.isArray(source) && _.isArray(target)) {
          _this2[key] = _.union(source, target);
        } else if (isHash(source) && isHash(target)) {
          _.assign(target, source);
        }
      });
      return this;
    }

    /**
     * Creates a clone of the definition
     * @returns {GraphQLFactoryDefinition}
     */

  }, {
    key: 'clone',
    value: function clone() {
      var definition = new GraphQLFactoryDefinition(this.factory);
      definition.error = this.error;
      return definition.merge(this);
    }

    /**
     * Looks up a function and throws an error if not found or the
     * value passed was not a function
     * @param fn
     * @returns {*}
     */

  }, {
    key: 'lookupFunction',
    value: function lookupFunction(fn, infoPath) {
      var func = _.isString(fn) ? _.get(this, ['functions', fn]) : fn;
      if (!_.isFunction(func)) {
        var infoMsg = infoPath ? ' at ' + infoPath : '';
        throw new Error('Failed to lookup function "' + fn + '"' + infoMsg);
      }
      return func;
    }

    /**
     * Adds a kind to the definition if it has not already been added
     * @param kind
     * @param name
     * @param value
     * @private
     */

  }, {
    key: 'addKind',
    value: function addKind(kind, name, value) {
      var key = definitionKey(kind);
      var store = _.get(this, [key]);
      if (!key) throw new Error('Invalid Kind "' + kind + '"');

      if (Array.isArray(store)) {
        store.push({ name: name, value: value });
      } else if (!this[key][name]) {
        store[name] = value;
      } else {
        this.warnings.push(kind + ' "' + name + '" has already been added');
      }
    }

    /**
     * Adds a plugin to the
     * @param plugin
     * @private
     */

  }, {
    key: '_processPlugin',
    value: function _processPlugin(plugin) {
      var name = plugin.name,
          install = plugin.install;

      if (name && !_.has(this.plugins, [name])) {
        this.plugins[name] = plugin;
        this.merge(plugin);
        this._processFactoryDefinition(plugin);
        if (_.isFunction(install)) install(this.factory);
      }
    }

    /**
     * Adds a function to the function registry
     * @param args
     * @private
     */

  }, {
    key: '_processFunction',
    value: function _processFunction() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var fn = args[0],
          name = args[1];

      // validate that its a function

      if (!_.isFunction(fn)) {
        throw new Error('function must be function');
      }

      // allow custom name
      var _name = _.isString(name) ? name : fn.name;

      // add the function
      this.addKind('Function', _name, fn);
    }

    /**
     * Processes a factory definition and merges its contents
     * @param args
     * @private
     */

  }, {
    key: '_processFactoryDefinition',
    value: function _processFactoryDefinition(definition) {
      this.merge(new GraphQLFactoryDefinitionTranslator(this.factory).translate(definition));
    }

    /**
     * Processes a definition string an optional backing, schemaName
     * @param args
     * @private
     */

  }, {
    key: '_processDefinition',
    value: function _processDefinition() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      var source = args[0],
          backing = args[1],
          schemaName = args[2];


      if (!_.isString(source) || source === '') {
        throw new Error('source must be String');
      }

      var _parse = graphql.parse(source),
          definitions = _parse.definitions;

      var _backing = backing;
      var _name = schemaName;

      // check for name as second argument
      if (_.isString(backing)) {
        _name = backing;
        _backing = new GraphQLFactoryBacking();
      }

      // merge the function map
      if (_backing instanceof GraphQLFactoryBacking || _.isObject(_backing)) {
        this.backing.merge(_backing);
      }

      // loop through the definitions
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = definitions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var definition = _step.value;

          var kind = _.get(definition, 'kind');

          if (kind === graphql.Kind.SCHEMA_DEFINITION) {
            if (!_.isString(_name) || _name === '') {
              throw new Error('Schema definition requires a name argument in use()');
            }
          } else {
            _name = _.get(definition, 'name.value');
          }

          // add the kind
          this.addKind(kind, _name, graphql.print(definition));
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
    }
  }]);
  return GraphQLFactoryDefinition;
}();

var GraphQLFactory = function (_EventEmitter) {
  inherits(GraphQLFactory, _EventEmitter);

  function GraphQLFactory() {
    classCallCheck(this, GraphQLFactory);

    var _this = possibleConstructorReturn(this, (GraphQLFactory.__proto__ || Object.getPrototypeOf(GraphQLFactory)).call(this));

    _this.definition = new GraphQLFactoryDefinition(_this);
    return _this;
  }

  createClass(GraphQLFactory, [{
    key: 'use',
    value: function use() {
      var _definition;

      (_definition = this.definition).use.apply(_definition, arguments);
    }
  }]);
  return GraphQLFactory;
}(EventEmitter);

module.exports = GraphQLFactory;
