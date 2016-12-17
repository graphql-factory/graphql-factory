import _ from './utils/index'
import GraphQLFactoryDefinition from './GraphQLFactoryDefinition'
import GraphQLFactoryLibrary from './GraphQLFactoryLibrary'
import utils from './utils/index'
import compiler from './compiler'
import constants from './types/constants'

export class GraphQLFactory {
  constructor (graphql) {
    this.graphql = graphql
    this.definition = new GraphQLFactoryDefinition()
    this.utils = utils
    this.compile = compiler
    this.constants = constants
  }

  plugin (plugins = []) {
    _.forEach(_.ensureArray(plugins), (p) => this.definition.merge(p))
  }

  make (definition = {}, options = {}) {
    let { plugin } = options
    this.plugin(plugin)
    this.definition.merge(definition)
    this.definition.compile()
    return new GraphQLFactoryLibrary(this.graphql, this.definition)
  }
}

let factory = function (graphql) {
  return new GraphQLFactory(graphql)
}

factory.constants = constants
factory.compile = compiler
factory.utils = utils
factory.GraphQLFactoryDefinition = GraphQLFactoryDefinition

export default factory