import GraphQLFactory from './factory'
import Definition from './definition/definition'
import Decomposer from './definition/decompose'
import Expander from './definition/expand'
import plugins from './plugins/index'

// create a factory function that creates a new instance
const Factory = function (graphql) {
  return new GraphQLFactory(graphql)
}

// add objects to the default export
Factory.Definition = Definition
Factory.Decomposer = Decomposer
Factory.Expander = Expander
Factory.plugins = plugins

// export the factory function
export default Factory
