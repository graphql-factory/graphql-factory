import GraphQLFactory from './factory'
import Definition from './definition/index'
import Decomposer from './definition/decompose'
import Expander from './definition/expand'

// create a factory function that creates a new instance
const Factory = function (graphql) {
  return new GraphQLFactory(graphql)
}

// add objects to the default export
Factory.Definition = Definition
Factory.Decomposer = Decomposer
Factory.Expander = Expander

// export the factory function
export default Factory