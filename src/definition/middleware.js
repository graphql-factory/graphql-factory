import _ from '../common/lodash.custom'
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

export default class Middleware {
  constructor (type, resolver, options) {
    const { timeout, priority, name } = _.isObject(options) && options !== null
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
    this.priority = _.isNumber(priority)
      ? Math.floor(priority)
      : null
  }
}
