import GraphQLFactoryDefinition from './definition'

export class GraphQLFactory {
  constructor (graphql) {
    this.graphql = graphql
    this.definition = new GraphQLFactoryDefinition()
  }

  make (definition = {}, options = {}) {

  }
}