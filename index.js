'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var EventEmitter = _interopDefault(require('events'));
var _ = _interopDefault(require('lodash'));
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
var INVALID_FN_NAMES = ['', 'resolve', 'isTypeOf', 'serialize', 'parseValue', 'parseLiteral', 'resolveType'];

// built in type name constants















// type alias values




// decomposable types




// middleware types
var BEFORE_MIDDLEWARE = 'before';
var AFTER_MIDDLEWARE = 'after';
var ERROR_MIDDLEWARE = 'error';
var RESOLVE_MIDDLEWARE = 'resolve';

// event names








// option defaults and constants
var DEFAULT_MIDDLEWARE_TIMEOUT = 300000; // 5 minutes

var MIDDLEWARE_TYPES = [BEFORE_MIDDLEWARE, AFTER_MIDDLEWARE, ERROR_MIDDLEWARE, RESOLVE_MIDDLEWARE];

var GraphQLFactoryMiddleware = function GraphQLFactoryMiddleware(type, resolver, options) {
  classCallCheck(this, GraphQLFactoryMiddleware);

  var _ref = _.isObject(options) && options !== null ? options : {},
      timeout = _ref.timeout,
      name = _ref.name;

  if (!_.includes(MIDDLEWARE_TYPES, type)) {
    throw new Error('GraphQLFactoryMiddlewareError: ' + 'Invalid middleware type "' + type + '"');
  } else if (!_.isFunction(resolver)) {
    throw new Error('GraphQLFactoryMiddlewareError: ' + 'Resolver must be a function');
  } else if (timeout && (!_.isNumber(timeout) || timeout < 0)) {
    throw new Error('GraphQLFactoryMiddlewareError: ' + 'Timeout must be an integer greater than or equal to 0');
  }
  this.type = type;
  this.resolver = resolver;
  this.name = _.isString(name) && name !== '' ? name : null;
  this.functionName = this.name || _.get(resolver, 'name') || type;

  this.timeout = _.isNumber(timeout) ? Math.floor(timeout) : DEFAULT_MIDDLEWARE_TIMEOUT;
};

/**
 * Function to determine if the value can be cast as middleware
 * @param middleware
 * @returns {boolean}
 */


GraphQLFactoryMiddleware.canCast = function (middleware) {
  return _.isFunction(middleware) || middleware instanceof GraphQLFactoryMiddleware;
};

/**
 * Function to cast a value to middleware
 * @param middleware
 * @param type
 * @param options
 * @returns {GraphQLFactoryMiddleware}
 */
GraphQLFactoryMiddleware.cast = function (middleware, type, options) {
  if (middleware instanceof GraphQLFactoryMiddleware) {
    if (_.includes(MIDDLEWARE_TYPES, type)) middleware.type = type;
    if (isHash(options) && _.keys(options).length) middleware.options = options;
    return middleware;
  } else if (_.isFunction(middleware)) {
    return new GraphQLFactoryMiddleware(type, middleware, options);
  }
  throw new Error('Cannot cast middleware, must be Function or Middleware');
};

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
 *   '@directives': [
 *     {
 *       name: String,
 *       before: Function | Middleware,
 *       after: Function | Middleware,
 *       error: Function | Middleware
 *     },
 *     ...
 *   ]
 * }
 *
 */
var canCast = GraphQLFactoryMiddleware.canCast;
var cast = GraphQLFactoryMiddleware.cast;

var MIDDLEWARES = [BEFORE_MIDDLEWARE, AFTER_MIDDLEWARE, ERROR_MIDDLEWARE];

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
 * Creates a hash of middleware and validates it
 * returnin an error if invalid
 * @param middleware
 * @returns {*}
 */
function validateMiddleware(middleware) {
  var mw = {};
  var error = null;

  if (!isHash(middleware)) {
    return new Error('Invalid "middleware" argument, must be object ' + 'containing middleware keys "before", "after", and/or "error"');
  }

  // loop through each possible middleware type and process it
  _.forEach(middleware, function (value, key) {
    if (error) return;
    if (_.includes(MIDDLEWARES, key)) {
      if (canCast(value)) {
        mw[key] = cast(value);
      } else if (stringValue(value)) {
        mw[key] = value;
      } else if (value !== undefined) {
        error = new Error('Invalid "' + key + '" middleware, must be Function or Middleware');
      }
    }
  });

  // if there is an error or no middleware, return an error
  if (error) {
    return error;
  } else if (!_.keys(mw).length) {
    return new Error('Invalid "middleware" argument, must be object ' + 'containing at least one "before", "after", and/or "error" middleware');
  }

  return mw;
}

/**
 * Backing for things that use middleware
 */

var MiddlewareBacking = function () {
  function MiddlewareBacking(backing, isDirective) {
    classCallCheck(this, MiddlewareBacking);

    this.backing = isHash(backing) ? backing : {};
    this._isDirective = isDirective;
  }

  /**
   * Adds a middleware config
   * @param typeName
   * @param fieldName
   * @param middleware
   * @returns {MiddlewareBacking}
   */


  createClass(MiddlewareBacking, [{
    key: 'middleware',
    value: function middleware(typeName, fieldName, _middleware) {
      var _this = this;

      var _ref = this._isDirective ? [fieldName, null] : [_middleware, fieldName],
          _ref2 = slicedToArray(_ref, 2),
          _mw = _ref2[0],
          _fieldName = _ref2[1];

      // validate args


      if (!stringValue(typeName)) {
        throw new Error('Invalid "typeName" argument, must be String');
      } else if (!this._isDirective && !stringValue(_fieldName)) {
        throw new Error('Invalid "fieldName" argument, must be String');
      }

      // validate the middleware
      var mw = validateMiddleware(_mw);
      if (mw instanceof Error) throw mw;

      // if directive add it to the list
      // otherwise add it to the field
      if (this._isDirective) {
        mw.name = typeName;
        this.backing['@directives'] = _.union(this.backing['@directives'], [mw]);
      } else {
        _.forEach(mw, function (value, type) {
          _.set(_this.backing, [typeName, _fieldName, type], value);
        });
      }
      return this;
    }
  }]);
  return MiddlewareBacking;
}();

var ResolveBacking = function (_MiddlewareBacking) {
  inherits(ResolveBacking, _MiddlewareBacking);

  function ResolveBacking(backing) {
    classCallCheck(this, ResolveBacking);
    return possibleConstructorReturn(this, (ResolveBacking.__proto__ || Object.getPrototypeOf(ResolveBacking)).call(this, backing, false));
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
}(MiddlewareBacking);

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
 * Builds a Directive backing
 */
var DirectiveBacking = function (_MiddlewareBacking2) {
  inherits(DirectiveBacking, _MiddlewareBacking2);

  function DirectiveBacking(backing) {
    classCallCheck(this, DirectiveBacking);
    return possibleConstructorReturn(this, (DirectiveBacking.__proto__ || Object.getPrototypeOf(DirectiveBacking)).call(this, backing, true));
  }

  return DirectiveBacking;
}(MiddlewareBacking);

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

    /**
     * Starts a new Directive backing
     * @returns {DirectiveBacking}
     * @constructor
     */

  }, {
    key: 'Directive',
    get: function get$$1() {
      return new DirectiveBacking(this.backing);
    }
  }]);
  return GraphQLFactoryBacking;
}();

var OPERATIONS = ['query', 'mutation', 'subscription'];

var GraphQLFactorySchema = function () {
  function GraphQLFactorySchema(definition, nameDefault) {
    classCallCheck(this, GraphQLFactorySchema);
    var name = definition.name,
        query = definition.query,
        mutation = definition.mutation,
        subscription = definition.subscription,
        description = definition.description,
        directives = definition.directives;


    this._definition = definition;
    this._description = description;
    this._rootTypes = {};
    this._backing = new GraphQLFactoryBacking(); // local backing
    this._directives = directives;
    this._types = {};
    this.name = name || nameDefault;
    this.query = this._addRootType('query', query);
    this.mutation = this._addRootType('mutation', mutation);
    this.subscription = this._addRootType('subscription', subscription);
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
     * Merges the backing into the schema
     * @param definition
     * @param schema
     * @private
     */

  }, {
    key: '_mergeBacking',
    value: function _mergeBacking(definition, schema) {
      var _this = this;

      var backing = new GraphQLFactoryBacking().merge(definition.backing).merge(this._backing);

      // get the non directive backing
      var backingTypes = _.omit(backing.backing, ['@directives']);

      // set the functions from the function map
      _.forEach(backingTypes, function (map, typeName) {
        var type = _.get(schema, ['_typeMap', typeName]);
        if (!isHash(map) || !type) return true;

        // apply the functions
        _.forEach(map, function (value, key) {
          var path = [];
          var func = null;
          var wrapMethod = '_bindFunction';
          var infoPath = '';

          // get the function/ref and path
          if (key.match(/^_/)) {
            func = value;
            path = [key.replace(/^_/, '')];
            infoPath = typeName + '.' + path[0];
          } else {
            func = _.get(value, 'resolve');
            path = ['_fields', key, 'resolve'];
            wrapMethod = '_wrapResolve';
            infoPath = typeName + '.' + key + '.resolve';
          }

          // set the method
          _.set(type, path, _this[wrapMethod](func, definition, infoPath));
        });
      });
    }

    /**
     * Wraps a resolver function in middleware
     * @param fn
     * @param definition
     * @param infoPath
     * @returns {Function}
     * @private
     */

  }, {
    key: '_wrapResolve',
    value: function _wrapResolve(fn, definition, infoPath) {
      return function (source, args, context, info) {
        // get the function
        var func = _.isString(fn) ? _.get(definition.functions, [fn]) : fn;

        // if not a function move on
        if (!_.isFunction(func)) {
          throw new Error('Invalid or missing ' + 'resolve for "' + infoPath + '"');
        }
        return func(source, args, context, info);
      };
    }

    /**
     * Wraps a regular function
     * @param fn
     * @param definition
     * @param infoPath
     * @returns {Function}
     * @private
     */

  }, {
    key: '_bindFunction',
    value: function _bindFunction(fn, definition, infoPath) {
      return function () {
        // get the function
        var func = _.isString(fn) ? _.get(definition.functions, [fn]) : fn;

        // if not a function move on
        if (!_.isFunction(func)) {
          throw new Error('Invalid or missing ' + 'function for "' + infoPath + '"');
        }

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return func.apply({}, [args]);
      };
    }

    /**
     * Add types to the schema
     * @param types
     */

  }, {
    key: 'addTypes',
    value: function addTypes(types) {
      if (isHash(types)) _.assign(this._types, types);
      return this;
    }

    /**
     * Creates a complete schema definition
     * @param types
     * @returns {string|*}
     */

  }, {
    key: 'export',
    value: function _export(types) {
      this.addTypes(types);
      return this.document;
    }

    /**
     * Builds a schema
     * @param definition
     */

  }, {
    key: 'build',
    value: function build(definition) {
      // TODO: determine a way to merge in the directives in a schema
      var types = _.get(definition, 'types', {});
      var document = this.export(types);
      var schema = graphql.buildSchema(document);
      this._mergeBacking(definition, schema);
      return schema;
    }

    /**
     * Create a complete .graphql document
     * @returns {string|*}
     */

  }, {
    key: 'document',
    get: function get$$1() {
      // join the type map with the schema definition
      var _types = _.assign({}, this._types, this._rootTypes);
      return _.map(_types, function (value) {
        return value;
      }).concat(this.definition).join('\n');
    }

    /**
     * Generates the schema definition
     * @returns {string}
     */

  }, {
    key: 'definition',
    get: function get$$1() {
      var _this2 = this;

      var _directives = getDirectives(this._definition);
      var ops = _.reduce(OPERATIONS, function (accum, operation) {
        if (_this2[operation]) {
          accum.push('  ' + operation + ': ' + _this2[operation]);
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
          args = definition.args;

      var _name = name || directiveName;
      var _args = this._arguments(args, 1);
      var _locations = _.filter(locations, _.isString);
      var _loc = _locations.length ? _locations.join(' | ') : _.map(graphql.DirectiveLocation).join(' | ');
      var directive = 'directive @' + _name + _args + ' on ' + _loc + '\n';

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
            defaultValue = definition.defaultValue,
            before = definition.before,
            after = definition.after,
            error = definition.error;

        // add resolve backing

        if (_.isFunction(resolve) || stringValue(resolve)) {
          _this.definition.backing[_parentType].resolve(parent, name, resolve);
        }

        // add middleware backing
        if (before || after || error) {
          _this.definition.backing[_parentType].middleware(parent, name, { before: before, after: after, error: error });
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

var CAN_MERGE = ['context', 'types', 'schemas', 'functions', 'directives', 'warnings', 'before', 'after', 'error'];

var GraphQLFactoryDefinition = function () {
  function GraphQLFactoryDefinition(factory) {
    classCallCheck(this, GraphQLFactoryDefinition);

    this.factory = factory;
    this.backing = new GraphQLFactoryBacking();
    this.context = {};
    this.types = {};
    this.schemas = {};
    this.functions = {};
    this.directives = [];
    this.error = null;
    this.warnings = [];
    this.before = [];
    this.after = [];
    this.error = [];
  }

  /**
   * adds definition fragments to the definition
   * @param args
   */


  createClass(GraphQLFactoryDefinition, [{
    key: 'use',
    value: function use() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (!args.length) throw new Error('use requires at least 1 argument');

      switch (constructorName(args[0])) {
        case 'String':
          this._processDefinition.apply(this, args);
          break;

        case 'Function':
          this._processFunction.apply(this, args);
          break;

        case 'Object':
        case 'GraphQLFactoryDefinition':
          this._processFactoryDefinition.apply(this, args);
          break;

        default:
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
     * Adds a function to the function registry
     * @param args
     * @private
     */

  }, {
    key: '_processFunction',
    value: function _processFunction() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      var fn = args[0],
          name = args[1];

      // validate that its a function

      if (!_.isFunction(fn)) {
        throw new Error('function must be function');
      }

      // allow custom name
      var _name = _.isString(name) ? name : fn.name;

      // ensure the name is valid
      if (_.includes(INVALID_FN_NAMES, _name)) {
        throw new Error('function name is not allowed or missing');
      }

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
    value: function _processFactoryDefinition() {
      this.merge(new GraphQLFactoryDefinitionTranslator(this.factory).translate(arguments.length <= 0 ? undefined : arguments[0]));
    }

    /**
     * Processes a definition string an optional backing, schemaName
     * @param args
     * @private
     */

  }, {
    key: '_processDefinition',
    value: function _processDefinition() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
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
