import _ from 'lodash'
import Definition from './definition/index'

class FactoryChain {
  constructor (graphql, definition) {
    this.graphql = graphql
    this._definition = definition || new Definition()
  }

  /**
   * Adds before middleware
   * @param middleware
   * @param timeout
   * @returns {*}
   */
  before (middleware, timeout) {
    this._definition.before(middleware, timeout)
    return this
  }

  /**
   * Adds after middleware
   * @param middleware
   * @param timeout
   * @returns {*}
   */
  after(middleware, timeout) {
    this._definition.after(middleware, timeout)
    return this
  }

  /**
   * Adds error middleware
   * @param middleware
   * @param timeout
   * @returns {*}
   */
  error (middleware, timeout) {
    this._definition.error(middleware, timeout)
    return this
  }

  /**
   * Adds an object to the definition
   * @param obj
   * @param name
   * @returns {*}
   */
  use (obj, name) {
    this._definition.use(obj, name)
    return this
  }

  /**
   * Adds a logger
   * @param log
   */
  logger (log) {
    return this
  }

  /**
   * Returns the current combined definition
   */
  get definition () {
    return this._definition
  }

  /**
   * Returns a new factory library of schema request functions
   */
  get library () {

  }

  /**
   * Returns a combined schema request function
   */
  get request () {

  }

  /**
   * Returns a hash of schema objects
   */
  get schemas () {

  }

  /**
   * Returns a combined schema object
   */
  get schema () {

  }

  /**
   * Returns the type objects
   */
  get types () {

  }
}

/**
 * Entry point for a new graphql factory chain
 */
export default class GraphQLFactory {
  constructor (graphql) {
    this.graphql = graphql
  }

  /**
   * Adds an object to the definition
   * @param obj
   * @param name
   * @returns {*}
   */
  use (obj, name) {
    return new FactoryChain(this.graphql).use(obj, name)
  }

  /**
   * Legacy interface for backward compatibility
   * @param definition
   * @param options
   */
  make (definition, options) {
    const {
      plugin,
      beforeResolve,
      afterResolve,
      beforeTimeout,
      afterTimeout,
      logger
    } = options &&_.isObject(options)
      ? options
      : {}

    const chain = new FactoryChain(this.graphql)

    if (logger) {
      chain.logger(logger)
    }

    chain.use(definition)
    if (plugin) {
      _.forEach(_.castArray(plugin), p => {
        chain.use(p)
      })
    }
    if (beforeResolve) {
      _.forEach(_.castArray(beforeResolve), b => {
        if (_.isFunction(b)) {
          chain.before(b, beforeTimeout)
        }
      })
    }
    if (afterResolve) {
      _.forEach(_.castArray(afterResolve), a => {
        if (_.isFunction(a)) {
          chain.before(a, afterTimeout)
        }
      })
    }

    const lib = chain.library
    return lib
  }
}