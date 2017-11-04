import _ from './common/lodash.custom'
import EventEmitter from 'events'
import Definition from './definition/definition'
import Decomposer from './definition/decompose'
import Expander from './definition/expand'
import Generator from './generate/generate'
import plugins from './plugins/index'
import tools from './tools/index'

class GraphQLFactory extends EventEmitter {
  constructor () {
    super()
    this.plugins = plugins
    this.tools = tools
    this.generator = new Generator()
    this.definition = new Definition(this)
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

// add objects to the default export
GraphQLFactory.Definition = Definition
GraphQLFactory.Decomposer = Decomposer
GraphQLFactory.Expander = Expander
GraphQLFactory.Generator = Generator
GraphQLFactory.plugins = plugins
GraphQLFactory.tools = tools

// export the graphql factory class
export default GraphQLFactory
