import _ from './lodash.custom'
import { DirectiveLocation, Kind } from 'graphql'
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
  constructor (config, options) {
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
      } else if (this.hasValue(value) && !_.get(options, 'allowDuplicates')) {
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

// Directive locations map to Kinds
export const LocationKind = new Enum({
  // Operations
  [DirectiveLocation.QUERY]: Kind.OPERATION_DEFINITION,
  [DirectiveLocation.MUTATION]: Kind.OPERATION_DEFINITION,
  [DirectiveLocation.SUBSCRIPTION]: Kind.OPERATION_DEFINITION,
  [DirectiveLocation.FIELD]: Kind.FIELD,
  [DirectiveLocation.FRAGMENT_DEFINITION]: Kind.FRAGMENT_DEFINITION,
  [DirectiveLocation.FRAGMENT_SPREAD]: Kind.FRAGMENT_SPREAD,
  [DirectiveLocation.INLINE_FRAGMENT]: Kind.INLINE_FRAGMENT,

  // Schema Definitions
  [DirectiveLocation.SCHEMA]: Kind.SCHEMA_DEFINITION,
  [DirectiveLocation.SCALAR]: Kind.SCALAR_TYPE_DEFINITION,
  [DirectiveLocation.OBJECT]: Kind.OBJECT_TYPE_DEFINITION,
  [DirectiveLocation.FIELD_DEFINITION]: Kind.FIELD_DEFINITION,
  [DirectiveLocation.ARGUMENT_DEFINITION]: Kind.ARGUMENT, // TODO:
  [DirectiveLocation.INTERFACE]: Kind.INTERFACE_TYPE_DEFINITION,
  [DirectiveLocation.UNION]: Kind.UNION_TYPE_DEFINITION,
  [DirectiveLocation.ENUM]: Kind.ENUM_TYPE_DEFINITION,
  [DirectiveLocation.ENUM_VALUE]: Kind.ENUM_VALUE_DEFINITION,
  [DirectiveLocation.INPUT_OBJECT]: Kind.INPUT_OBJECT_TYPE_DEFINITION,
  [DirectiveLocation.INPUT_FIELD_DEFINITION]: Kind.INPUT_VALUE_DEFINITION,
}, { allowDuplicates: true })


export const KindLocation = new Enum({
  // Operations
  [Kind.OPERATION_DEFINITION]: DirectiveLocation.QUERY,
  [Kind.OPERATION_DEFINITION]: DirectiveLocation.MUTATION,
  [Kind.OPERATION_DEFINITION]: DirectiveLocation.SUBSCRIPTION,
  [Kind.FIELD]: DirectiveLocation.FIELD,
  [Kind.FRAGMENT_DEFINITION]: DirectiveLocation.FRAGMENT_DEFINITION,
  [Kind.FRAGMENT_SPREAD]: DirectiveLocation.FRAGMENT_SPREAD,
  [Kind.INLINE_FRAGMENT]: DirectiveLocation.INLINE_FRAGMENT,

  // Schema Definitions
  [Kind.SCHEMA_DEFINITION]: DirectiveLocation.SCHEMA,
  [Kind.SCALAR_TYPE_DEFINITION]: DirectiveLocation.SCALAR,
  [Kind.OBJECT_TYPE_DEFINITION]: DirectiveLocation.OBJECT,
  [Kind.FIELD_DEFINITION]: DirectiveLocation.FIELD_DEFINITION,
  [Kind.ARGUMENT]: DirectiveLocation.ARGUMENT_DEFINITION,
  [Kind.INTERFACE_TYPE_DEFINITION]: DirectiveLocation.INTERFACE,
  [Kind.UNION_TYPE_DEFINITION]: DirectiveLocation.UNION,
  [Kind.ENUM_TYPE_DEFINITION]: DirectiveLocation.ENUM,
  [Kind.ENUM_VALUE_DEFINITION]: DirectiveLocation.ENUM_VALUE,
  [Kind.INPUT_OBJECT_TYPE_DEFINITION]: DirectiveLocation.INPUT_OBJECT,
  [Kind.INPUT_VALUE_DEFINITION]: DirectiveLocation.INPUT_FIELD_DEFINITION,
}, { allowDuplicates: true })

// lifecycle middleware
export const Lifecycle = new Enum({
  BEFORE_BUILD: 'beforeBuild',
  AFTER_BUILD: 'afterBuild',
  BEFORE_REQUEST: 'beforeRequest',
  AFTER_REQUEST: 'afterRequest',
  REQUEST_ERROR: 'requestError',
  BEFORE_RESOLVE: 'beforeResolve',
  RESOLVE: 'resolve',
  AFTER_RESOLVE: 'afterResolve',
  BEFORE_QUERY: 'beforeQuery',
  AFTER_QUERY: 'afterQuery',
  BEFORE_MUTATION: 'beforeMutation',
  AFTER_MUTATION: 'afterMutation',
  BEFORE_SUBSCRIPTION: 'beforeSubscription',
  SUBSCRIPTION_START: 'subscriptionStart',
  SUBSCRIPTION_DATA: 'subscriptionData',
  SUBSCRIPTION_END: 'subscriptionEnd'
})

// directive conflicts
export const DirectiveConflict = new Enum({
  DEFINITION: 'definition', // on conflict, use the definition args
  OPERATION: 'operation', // on conflict, use the operation args
  ERROR: 'error', // on conflict, throw an error
  WARN: 'warn', // on conflict, log a warning
  MERGE: 'merge' // on conflict, attempt to merge the args
})

// option defaults and constants
export const DEFAULT_MIDDLEWARE_TIMEOUT = 300000 // 5 minutes
