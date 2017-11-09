import _ from 'lodash'
import {isHash} from '../common/util'
import {
  BEFORE_MIDDLEWARE,
  AFTER_MIDDLEWARE,
  ERROR_MIDDLEWARE,
  RESOLVE_MIDDLEWARE,
  DEFAULT_MIDDLEWARE_TIMEOUT
} from '../common/const'

const MIDDLEWARE_TYPES = [
  BEFORE_MIDDLEWARE,
  AFTER_MIDDLEWARE,
  ERROR_MIDDLEWARE,
  RESOLVE_MIDDLEWARE
]

class GraphQLFactoryMiddleware {
  constructor (type, resolver, options) {
    const { timeout, name } = _.isObject(options) && options !== null
      ? options
      : {}

    if (!_.includes(MIDDLEWARE_TYPES, type)) {
      throw new Error('GraphQLFactoryMiddlewareError: '
        + 'Invalid middleware type "' + type + '"')
    } else if (!_.isFunction(resolver)) {
      throw new Error('GraphQLFactoryMiddlewareError: '
        + 'Resolver must be a function')
    } else if (timeout && (!_.isNumber(timeout) || timeout < 0)) {
      throw new Error('GraphQLFactoryMiddlewareError: '
        + 'Timeout must be an integer greater than or equal to 0')
    }
    this.type = type
    this.resolver = resolver
    this.name = _.isString(name) && name !== ''
      ? name
      : null
    this.functionName = this.name || _.get(resolver, 'name') || type

    this.timeout = _.isNumber(timeout)
      ? Math.floor(timeout)
      : DEFAULT_MIDDLEWARE_TIMEOUT
  }
}

/**
 * Function to determine if the value can be cast as middleware
 * @param middleware
 * @returns {boolean}
 */
GraphQLFactoryMiddleware.canCast = middleware => {
  return _.isFunction(middleware) || middleware instanceof GraphQLFactoryMiddleware
}

/**
 * Function to cast a value to middleware
 * @param middleware
 * @param type
 * @param options
 * @returns {GraphQLFactoryMiddleware}
 */
GraphQLFactoryMiddleware.cast = (middleware, type, options) => {
  if (middleware instanceof GraphQLFactoryMiddleware) {
    if (_.includes(MIDDLEWARE_TYPES, type)) middleware.type = type
    if (isHash(options) && _.keys(options).length) middleware.options = options
    return middleware
  } else if (_.isFunction(middleware)) {
    return new GraphQLFactoryMiddleware(type, middleware, options)
  }
  throw new Error('Cannot cast middleware, must be Function or Middleware')
}

export default GraphQLFactoryMiddleware
