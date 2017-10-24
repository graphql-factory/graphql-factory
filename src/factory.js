import _ from './common/lodash.custom'
import Definition from './definition/definition'
import Generator from './generate/generate'

class FactoryChain {
  constructor (graphql, definition) {
    this.graphql = graphql
    this._definition = definition instanceof Definition
      ? definition
      : new Definition()
    this._logger = {}
  }

  /**
   * Creates a new clone of the factory definition
   * logger settings are not cloned
   * @returns {FactoryChain}
   */
  clone () {
    return new FactoryChain(this.graphql, this._definition.clone())
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
  after (middleware, timeout) {
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
    if (!log || !_.isObject(log)) {
      throw new Error('GraphQLFactoryError:'
        + 'Logger must be an object')
    }
    this._logger = log
    return this
  }

  /**
   * Returns a merged or cloned definition object
   * @param options
   * @returns {*}
   */
  definition (options) {
    const { mergeSchemas } = options && _.isObject(options)
      ? options
      : {}

    return _.isString(mergeSchemas) && mergeSchemas !== ''
      ? this._definition.mergeSchemas(mergeSchemas, options)
      : this._definition.clone()
  }

  /**
   * Generates a registry
   * @param options
   */
  registry (options) {
    const def = this.definition(options)
    return new Generator(this.graphql)
      .generate(def)
      .registry
  }

  /**
   * Returns a new library
   * @param options
   * @returns {*}
   */
  library (options) {
    const def = this.definition(options)
    return new Generator(this.graphql)
      .generate(def)
      .lib
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
   * Adds a logger and returns a new factory chain
   * @param log
   * @returns {*}
   */
  logger (log) {
    return new FactoryChain(this.graphql).logger(log)
  }

  /**
   * Adds an object to the definition
   * and returns a new factory chain
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
    } = options && _.isObject(options)
      ? options
      : {}

    const chain = new FactoryChain(this.graphql)

    if (logger) chain.logger(logger)
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

    const lib = chain.library()
    return lib
  }
}
