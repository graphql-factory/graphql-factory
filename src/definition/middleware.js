import _ from '../common/lodash.custom'
import {
  BEFORE_MIDDLEWARE,
  AFTER_MIDDLEWARE,
  ERROR_MIDDLEWARE,
  DEFAULT_MIDDLEWARE_TIMEOUT
} from '../common/const'

const MIDDLEWARE_TYPES = [
  BEFORE_MIDDLEWARE,
  AFTER_MIDDLEWARE,
  ERROR_MIDDLEWARE
]

export default class Middleware {
  constructor (type, resolver, timeout) {
    if (!_.includes(MIDDLEWARE_TYPES, type)) {
      throw new Error('GraphQLFactoryMiddlewareError: '
        + 'Invalid middleware type "' + type + '"')
    } else if (!_.isFunction(resolver)) {
      throw new Error('GraphQLFactoryMiddlewareError: '
        + 'Resolver must be a function')
    } else if (timeout && (!_.isNumber(timeout) || timeout < 1)) {
      throw new Error('GraphQLFactoryMiddlewareError: '
        + 'Timeout must be an integer greater than 0')
    }
    this.type = type
    this.resolver = resolver
    this.timeout = _.isNumber(timeout)
      ? Math.floor(timeout)
      : DEFAULT_MIDDLEWARE_TIMEOUT
  }
}
