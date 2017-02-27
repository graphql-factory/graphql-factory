import GraphQLFactoryCompiler from './GraphQLFactoryCompiler'
import GraphQLFactoryDefinition from './GraphQLFactoryDefinition'
import GraphQLFactoryLibrary from './GraphQLFactoryLibrary'
import GraphQLFactoryTypeGenerator from './types/GraphQLFactoryTypeGenerator'
import utils from './utils/index'
import constants from './types/constants'

// standalone definition builder
function define (definition = {}, options = {}) {
  return new GraphQLFactoryDefinition(definition, options)
}

// standalone compiler
function compile (definition = {}, options = {}) {
  let { plugin } = options
  if (definition instanceof GraphQLFactoryDefinition) {
    return definition.registerPlugin(plugin).compile()
  }
  return define(definition, options).compile()
}

/**
 * graphql-factory instance
 * @property {GraphQL} graphql - instance of graphql
 * @property {ConstantsEnum} constants
 * @property {FactoryUtils} utils - Util functions
 */
export class GraphQLFactory {
  constructor (graphql) {
    /**
     * Compiles a {@link FactoryDefinition}
     * @function compile
     * @param {FactoryDefinition} definition
     * @param {Object} [options]
     * @param {String|Array} options.plugin - Plugin or array of plugins
     * @returns {GraphQLFactoryDefinition}
     */
    this.compile = compile
    this.constants = constants

    /**
     * Creates an un-compiled {@link FactoryDefinition}
     * @function define
     * @param {FactoryDefinition} definition
     * @param {Object} [options]
     * @param {String|Array} options.plugin - Plugin or array of plugins
     * @returns {GraphQLFactoryDefinition}
     */
    this.define = define
    this.graphql = graphql
    this.utils = utils
  }

  /**
   * Creates a new GraphQLFactoryLibrary
   * @param {FactoryDefinition} definition
   * @param {Object} options
   * @param {String|Array} options.plugin - Plugin or array of plugins
   * @returns {GraphQLFactoryLibrary}
   */
  make (definition = {}, options = {}) {
    let { plugin, beforeResolve, afterResolve, beforeTimeout, afterTimeout } = options
    let factoryDef = definition instanceof GraphQLFactoryDefinition
      ? definition
      : new GraphQLFactoryDefinition(definition)

    factoryDef.registerPlugin(plugin)
      .beforeResolve(beforeResolve)
      .beforeTimeout(beforeTimeout)
      .afterResolve(afterResolve)
      .afterTimeout(afterTimeout)
      .compile()

    return new GraphQLFactoryLibrary(this.graphql, factoryDef)
  }
}

/**
 * Create a new instance of graphql-factory
 * @module graphql-factory
 *
 * @param {GraphQL} graphql - Instance of graphql
 * @returns {GraphQLFactory} instance of graphql-factory
 * @example <caption>ES5</caption>
 * var graphql = require('graphql')
 * var GraphQLFactory = require('graphql-factory')
 * var factory = GraphQLFactory(graphql)
 * @example <caption>ES6</caption>
 * import * as graphql from 'graphql'
 * import GraphQLFactory from 'graphql-factory'
 * let factory = GraphQLFactory(graphql)
 */
let factory = function (graphql) {
  return new GraphQLFactory(graphql)
}

// add tools to main module
factory.compile = compile
factory.constants = constants
factory.define = define
factory.utils = utils

// add classes to main module
factory.GraphQLFactory = GraphQLFactory
factory.GraphQLFactoryCompiler = GraphQLFactoryCompiler
factory.GraphQLFactoryDefinition = GraphQLFactoryDefinition
factory.GraphQLFactoryLibrary = GraphQLFactoryLibrary
factory.GraphQLFactoryTypeGenerator = GraphQLFactoryTypeGenerator

// export main factory methods
export default factory