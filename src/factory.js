import _ from './common/lodash.custom'
import EventEmitter from 'events'
import Definition from './definition/definition'
import Generator from './generate/generate'

class FactoryChain extends EventEmitter {
  constructor (graphql) {
    super()
    this.graphql = graphql
    this.definition = new Definition(this)
    this.generator = new Generator(graphql)
  }

  /**
   * Adds before middleware
   * @param middleware
   * @param timeout
   * @returns {*}
   */
  before (middleware, timeout) {
    this.definition.before(middleware, timeout)
    return this
  }

  /**
   * Adds after middleware
   * @param middleware
   * @param timeout
   * @returns {*}
   */
  after (middleware, timeout) {
    this.definition.after(middleware, timeout)
    return this
  }

  /**
   * Adds error middleware
   * @param middleware
   * @param timeout
   * @returns {*}
   */
  error (middleware, timeout) {
    this.definition.error(middleware, timeout)
    return this
  }

  /**
   * Adds an object to the definition
   * @param obj
   * @param name
   * @returns {*}
   */
  use (obj, name) {
    this.definition.use(obj, name)
    return this
  }

  /**
   * Regenerates the types
   * @param options
   * @returns {*}
   */
  regenerate (options) {
    const { mergeSchemas } = options && _.isObject(options)
      ? options
      : {}

    // check for merge schema options
    if (_.isString(mergeSchemas) && mergeSchemas !== '') {
      this.definition.mergeSchemas(mergeSchemas, options)
    }

    // generate a new library
    return this.generator
      .generate(this.definition)
  }

  /**
   * Returns a new library
   * @param options
   * @returns {*}
   */
  library (options) {
    return this.regenerate(options).lib
  }
}

/**
 * Entry point for a new graphql factory chain
 */
export class GraphQLFactory {
  constructor (graphql) {
    this.graphql = graphql
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
}

/**
 * Export a new factory generator
 * Each call to factory.use() will create a new
 * chain and potential library
 * @param graphql
 * @returns {GraphQLFactory}
 * @constructor
 */
export default function Factory (graphql) {
  return new GraphQLFactory(graphql)
}
