import _ from '../common/lodash.custom'
import { isHash, stringValue } from '../common/util'
import {
  DEFAULT_MIDDLEWARE_TIMEOUT,
  Lifecycle
} from '../common/const'

/**
 * Middleware class
 */
class GraphQLFactoryMiddleware {
  constructor (type, resolve, options) {
    const { timeout, name, identifier } = isHash(options)
      ? options
      : {}

    if (!Lifecycle.hasValue(type)) {
      throw new Error('GraphQLFactoryMiddlewareError: '
        + 'Invalid middleware type "' + type + '"')
    } else if (!_.isFunction(resolve)) {
      throw new Error('GraphQLFactoryMiddlewareError: '
        + 'resolve must be a function')
    } else if (timeout && (!_.isNumber(timeout) || timeout < 0)) {
      throw new Error('GraphQLFactoryMiddlewareError: '
        + 'Timeout must be an integer greater than or equal to 0')
    }
    this.type = type
    this.resolve = resolve
    this.name = stringValue(name)
      ? name
      : null
    this.identifier = identifier
      || this.name
      || _.get(resolve, 'name')
      || type

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
  return _.isFunction(middleware)
    || middleware instanceof GraphQLFactoryMiddleware
    || (isHash(middleware) && _.has(middleware, 'resolve'))
}

/**
 * Function to cast a value to middleware
 * @param middleware
 * @param type
 * @param options
 * @returns {GraphQLFactoryMiddleware}
 */
GraphQLFactoryMiddleware.cast = (type, middleware, options) => {
  if (middleware instanceof GraphQLFactoryMiddleware) {
    if (Lifecycle.hasValue(type)) middleware.type = type
    if (isHash(options) && _.keys(options).length) middleware.options = options
    return middleware
  } else if (_.isFunction(middleware)) {
    return new GraphQLFactoryMiddleware(type, middleware, options)
  } else if (isHash(middleware) && _.has(middleware, 'resolve')) {
    const { resolve, name, timeout } = middleware
    return new GraphQLFactoryMiddleware(
      type,
      resolve,
      _.assign({ name, timeout }, options)
    )
  }

  throw new Error('Cannot cast middleware, must be Function or Middleware')
}

export default GraphQLFactoryMiddleware
