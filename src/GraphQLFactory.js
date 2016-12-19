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

// main graphql factory class
export class GraphQLFactory {
  constructor (graphql) {
    this.compile = compile
    this.constants = constants
    this.define = define
    this.graphql = graphql
    this.utils = utils

  }

  make (definition = {}, options = {}) {
    let { plugin } = options
    let factoryDef = new GraphQLFactoryDefinition()
    factoryDef.merge(definition).registerPlugin(plugin).compile()
    return new GraphQLFactoryLibrary(this.graphql, factoryDef)
  }
}

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