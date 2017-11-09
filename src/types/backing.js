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
import _ from 'lodash'
import { isHash, stringValue } from '../common/util'
import Middleware from './middleware'
import {
  BEFORE_MIDDLEWARE,
  AFTER_MIDDLEWARE,
  ERROR_MIDDLEWARE
} from '../common/const'

const { canCast, cast } = Middleware
const MIDDLEWARES = [
  BEFORE_MIDDLEWARE,
  AFTER_MIDDLEWARE,
  ERROR_MIDDLEWARE
]

/**
 * Adds a type function to the backing
 * @param typeName
 * @param funcName
 * @param func
 * @returns {addTypeFunction}
 */
function addTypeFunction (typeName, funcName, func) {
  if (!stringValue(typeName)) {
    throw new Error('Invalid "typeName" argument, must be String')
  } else if (!_.isFunction(func) && !stringValue(func)) {
    throw new Error('Invalid func argument, must be function')
  }
  _.set(this.backing, [ typeName, `_${funcName}` ], func)
  return this
}

/**
 * Creates a hash of middleware and validates it
 * returnin an error if invalid
 * @param middleware
 * @returns {*}
 */
function validateMiddleware (middleware) {
  const mw = {}
  let error = null

  if (!isHash(middleware)) {
    return new Error('Invalid "middleware" argument, must be object '
      + 'containing middleware keys "before", "after", and/or "error"')
  }

  // loop through each possible middleware type and process it
  _.forEach(middleware, (value, key) => {
    if (error) return
    if (_.includes(MIDDLEWARES, key)) {
      if (canCast(value)) {
        mw[key] = cast(value)
      } else if (stringValue(value)) {
        mw[key] = value
      } else if (value !== undefined) {
        error = new Error('Invalid "' + key
          + '" middleware, must be Function or Middleware')
      }
    }
  })

  // if there is an error or no middleware, return an error
  if (error) {
    return error
  } else if (!_.keys(mw).length) {
    return new Error('Invalid "middleware" argument, must be object '
      + 'containing at least one "before", "after", and/or "error" middleware')
  }

  return mw
}

/**
 * Backing for things that use middleware
 */
export class MiddlewareBacking {
  constructor (backing, isDirective) {
    this.backing = isHash(backing)
      ? backing
      : {}
    this._isDirective = isDirective
  }

  /**
   * Adds a middleware config
   * @param typeName
   * @param fieldName
   * @param middleware
   * @returns {MiddlewareBacking}
   */
  middleware (typeName, fieldName, middleware) {
    const [ _mw, _fieldName ] = this._isDirective
      ? [ fieldName, null ]
      : [ middleware, fieldName ]

    // validate args
    if (!stringValue(typeName)) {
      throw new Error('Invalid "typeName" argument, must be String')
    } else if (!this._isDirective && !stringValue(_fieldName)) {
      throw new Error('Invalid "fieldName" argument, must be String')
    }

    // validate the middleware
    const mw = validateMiddleware(_mw)
    if (mw instanceof Error) throw mw

    // if directive add it to the list
    // otherwise add it to the field
    if (this._isDirective) {
      mw.name = typeName
      this.backing['@directives'] = _.union(this.backing['@directives'], [ mw ])
    } else {
      _.forEach(mw, (value, type) => {
        _.set(
          this.backing,
          [ typeName, _fieldName, type ],
          value
        )
      })
    }
    return this
  }
}

/**
 * Backing for things that have resolve functions
 */
export class ResolveBacking extends MiddlewareBacking {
  constructor (backing) {
    super(backing, false)
  }

  /**
   * Adds a resolve function to the backing
   * @param typeName
   * @param fieldName
   * @param resolve
   * @returns {GraphQLFactoryBacking}
   */
  resolve (typeName, fieldName, resolve) {
    if (!stringValue(typeName)) {
      throw new Error('Missing required argument "typeName"')
    } else if (!stringValue(typeName)) {
      throw new Error('Missing required argument "fieldName"')
    } else if (!_.isFunction(resolve) && !stringValue(resolve)) {
      throw new Error('Invalid "resolve" argument, must be function')
    }
    _.set(this.backing, [ typeName, fieldName, 'resolve' ], resolve)
    return this
  }
}

/**
 * Builds a scalar backing
 */
export class ScalarBacking {
  constructor (backing) {
    this.backing = isHash(backing)
      ? backing
      : {}
  }

  /**
   * adds a serialize function
   * @param type
   * @param func
   * @returns {*}
   */
  serialize (type, func) {
    return addTypeFunction.call(this, type, 'serialize', func)
  }

  /**
   * adds a parseValue function
   * @param type
   * @param func
   * @returns {*}
   */
  parseValue (type, func) {
    return addTypeFunction.call(this, type, 'parseValue', func)
  }

  /**
   * adds a parseLiteral function
   * @param type
   * @param func
   * @returns {*}
   */
  parseLiteral (type, func) {
    return addTypeFunction.call(this, type, 'parseLiteral', func)
  }
}

/**
 * Builds an object backing
 * supports field level middleware
 */
export class ObjectBacking extends ResolveBacking {
  constructor (backing) {
    super(backing)
  }

  /**
   * Adds isTypeOf
   * @param type
   * @param func
   */
  isTypeOf (type, func) {
    return addTypeFunction.call(this, type, 'isTypeOf', func)
  }
}

/**
 * Builds an interface backing
 * supports field level middleware
 */
export class InterfaceBacking extends ResolveBacking {
  constructor (backing) {
    super(backing)
  }

  /**
   * adds a resolveType function
   * @param type
   * @param func
   */
  resolveType (type, func) {
    return addTypeFunction.call(this, type, 'resolveType', func)
  }
}

/**
 * Builds a Union backing
 */
export class UnionBacking {
  constructor (backing) {
    this.backing = isHash(backing)
      ? backing
      : {}
  }

  /**
   * adds a resolveType function
   * @param type
   * @param func
   */
  resolveType (type, func) {
    return addTypeFunction.call(this, type, 'resolveType', func)
  }
}

/**
 * Builds a Directive backing
 */
export class DirectiveBacking extends MiddlewareBacking {
  constructor (backing) {
    super(backing, true)
  }
}

/**
 * Entry point for building a backing
 */
export default class GraphQLFactoryBacking {
  constructor (backing) {
    this.backing = isHash(backing)
      ? backing
      : {}
  }

  /**
   * Merge another backing into this one
   * @param backing
   */
  merge (backing) {
    const _backing = backing instanceof GraphQLFactoryBacking
      ? backing.backing
      : backing
    _.assign(this.backing, _backing)
    return this
  }

  /**
   * Start a new Scalar backing
   * @returns {ScalarBacking}
   * @constructor
   */
  get Scalar () {
    return new ScalarBacking(this.backing)
  }

  /**
   * Start a new Object backing
   * @returns {ObjectBacking}
   * @constructor
   */
  get Object () {
    return new ObjectBacking(this.backing)
  }

  /**
   * Start a new Interface backing
   * @returns {InterfaceBacking}
   * @constructor
   */
  get Interface () {
    return new InterfaceBacking(this.backing)
  }

  /**
   * Start a new Union backing
   * @returns {UnionBacking}
   * @constructor
   */
  get Union () {
    return new UnionBacking(this.backing)
  }

  /**
   * Starts a new Directive backing
   * @returns {DirectiveBacking}
   * @constructor
   */
  get Directive () {
    return new DirectiveBacking(this.backing)
  }
}
