import _ from './utils/index'
import GraphQLFactoryDefinition from './definition'
import GraphQLFactoryLibrary from './lib'
import utils from './utils/index'
import compiler from './compiler'

export class GraphQLFactory {
  constructor (graphql) {
    this.graphql = graphql
    this.definition = new GraphQLFactoryDefinition()
    this.utils = utils
    this.compile = compiler
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

factory.compile = compiler
factory.utils = utils
factory.GraphQLFactoryDefinition = GraphQLFactoryDefinition

export default factory