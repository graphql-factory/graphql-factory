import _ from 'lodash'
/**
 * List of invalid function names to register
 * Invalid because they can be the field name and prone to duplicate
 * @type {[string,string,string,string,string,string,string]}
 */

const ENUM_RESERVED = [ 'hasKey', 'hasValue', '_keys', '_values' ]

/**
 * Enum class, creates an enum with values passed in the config
 * and errors when they dont exists or modification is attempted
 * also provides a hasValue method for checking existence of value
 */
export class Enum {
  constructor (config) {
    let error = null
    this._keys = []
    this._values = []

    /**
     * Determines if the value exists without throwing an error
     * @param value
     * @returns {boolean}
     */
    this.hasValue = value => {
      return this._values.indexOf(value) !== -1
    }

    /**
     * Determines if the key exists
     * @param key
     * @returns {boolean}
     */
    this.hasKey = key => {
      return this._keys.indexOf(key) !== -1
    }

    const _config = !_.isArray(config)
      ? config
      : _.reduce(config, (accum, item) => {
        accum[item] = item
        return accum
      })

    // try to add each key/value
    _.forEach(_config, (value, key) => {
      if (this.hasKey(key)) {
        error = new Error(`NewEnumError: Duplicate Enum key "${key}"`)
        return false
      } else if (this.hasValue(value)) {
        error = new Error(`NewEnumError: Duplicate Enum value ${value}`)
        return false
      } else if (ENUM_RESERVED.indexOf(key) !== -1) {
        error = new Error(`NewEnumError: Enum key "${key}" is reserved and cannot be used`)
        return false
      }

      this._keys.push(key)
      this._values.push(value)
      this[key] = value
    })

    // throw the error if encountered
    if (error) throw error

    // return a proxy to this class which allows readonly functionality
    // and error throwing
    return new Proxy(this, {
      get: (target, key) => {
        if (!_.has(target, [ key ])) {
          throw new Error(`Invalid Enum value ${key}`)
        }
        return target[key]
      },
      set: () => {
        throw new Error('Enum type cannot be modified')
      },
      has: (target, key) => {
        return _.has(target, key)
      },
      deleteProperty: () => {
        throw new Error('Enum type cannot be modified')
      },
      defineProperty: () => {
        throw new Error('Enum type cannot be modified')
      }
    })
  }
}

// middleware types
export const MiddlewareTypes = new Enum({
  BEFORE: 'before',
  AFTER: 'after',
  ERROR: 'error',
  RESOLVE: 'resolve'
})

// schema operations
export const SchemaOperations = new Enum({
  QUERY: 'query',
  MUTATION: 'mutation',
  SUBSCRIPTION: 'subscription'
})

// events
export const EventTypes = new Enum({
  REQUEST: 'request',
  FATAL: 'fatal',
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace'
})


// option defaults and constants
export const DEFAULT_MIDDLEWARE_TIMEOUT = 300000 // 5 minutes
export const RANDOM_MAX = 1000000000000000
export const DIRECTIVE_KEY = '@directives'
