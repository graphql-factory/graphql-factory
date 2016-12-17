import _ from './utils/index'
import GraphQLFactoryDefinition from './definition'
import GraphQLFactoryLibrary from './lib'
import utils from './utils/utils'

export class GraphQLFactory {
  constructor (graphql) {
    this.graphql = graphql
    this.definition = new GraphQLFactoryDefinition()
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

factory.utils = utils
factory.GraphQLFactoryDefinition = GraphQLFactoryDefinition

export default factory