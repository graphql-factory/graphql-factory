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
 *     bar: Function | Middleware
 *   },
 *   '@directiveName': {
 *      before: Function | Middleware,
 *      after: Function | Middleware,
 *      error: Function | Middleware
 *   },
 *   ...
 * }
 *
 */
import _ from '../common/lodash.custom'
import { isHash, stringValue } from '../common/util'
import Middleware from '../types/middleware'
import processMiddleware from '../middleware/request'
import { Lifecycle } from '../common/const'

// middleware helper methods
const { cast, canCast } = Middleware

/**
 * Creates a middleware function from the field resolve
 * @param resolver
 * @returns {Function}
 */
function resolverMiddleware (resolver) {
  return function (req, res, next) {
    try {
      const { source, args, context, info } = req
      const nonCircularReq = _.omit(req, [ 'context' ])
      const ctx = _.assign({}, context, { req: nonCircularReq, res, next })
      const value = resolver(source, args, ctx, info)

      // return a resolved promise
      return Promise.resolve(value)
        .then(result => {
          req.result = result
          return next()
        })
        .catch(next)
    } catch (err) {
      return next(err)
    }
  }
}

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
 * Backing for things that have resolve functions
 */
export class ResolveBacking {
  constructor (backing) {
    this.backing = backing
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
   * Hydrates the schema with the current backing which contains
   * things that cannot be expressed in the schema language
   * @param schema
   * @param definition
   * @returns {*}
   */
  hydrateSchema (schema, definition) {
    let err = null
    const backing = this

    // set the functions from the function map
    _.forEach(this.backing, (typeBacking, typeName) => {
      if (err) return false

      // skip directives for now
      if (typeName.match(/^@/)) return true

      // get the type and validate that the type backing is a hash
      const type = _.get(schema, [ '_typeMap', typeName ])
      if (!type || !isHash(typeBacking) || !_.keys(typeBacking).length) {
        return true
      }

      // hydrate the types
      _.forEach(typeBacking, (value, key) => {
        if (err) return false

        // catch any errors. these will most likely be function lookup errors
        try {
          if (key.match(/^_/)) {
            const path = [ key.replace(/^_/, '') ]
            const infoPath = `${typeName}.${path[0]}`
            const func = definition.lookupFunction(value, infoPath)

            // wrap the function and add a context
            // then hydrate the type
            _.set(type, path, function (...args) {
              const context = _.assign({}, definition.context)
              return func.apply(context, args)
            })
          } else if (_.isString(value) || canCast(value)) {
            const resolvePath = [ '_fields', key, 'resolve' ]
            const factoryPath = [ '_fields', key, '_factory', 'resolve' ]
            const infoPath = `${typeName}.${key}.resolve`
            const resolver = value instanceof Middleware
              ? value
              : _.isString(value) || _.isFunction(value)
                ? resolverMiddleware(definition.lookupFunction(value, infoPath))
                : value

            // cast the middleware
            const resolveMiddleware = cast(
              Lifecycle.RESOLVE,
              resolver
            )

            // set the resolve middleware on the factory extension
            _.set(type, factoryPath, resolveMiddleware)

            // finally hydrate the resolve with the proxy
            _.set(type, resolvePath, function resolve (...args) {
              return processMiddleware(schema, backing, definition, args)
            })
          } else {
            throw new Error('Invalid Backing at "'
              + typeName + '.' + key + '", should be '
              + 'Function or Object but found ' + (typeof value))
          }
        } catch (backingError) {
          err = backingError
          return false
        }
      })
    })

    // hydrate/extend the directives
    _.forEach(schema._directives, directive => {
      const { name } = directive
      const directiveBacking = _.get(this.backing, `@${name}`, {})
      directive._factory = directiveBacking
    })

    // check for merge errors
    if (err) throw err

    // otherwise return the hydrated schema
    return schema
  }

  /**
   * Starts a new Directive backing
   * @returns {DirectiveBacking}
   * @constructor
   */
  Directive (name, directive) {
    _.set(this.backing, `@${name}`, directive._factory)
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
}
