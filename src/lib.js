import _ from './utils/index'
import GraphQLFactoryTypeGenerator from './types/index'

export default class GraphQLFactoryLibrary {
  constructor (graphql, definition) {
    let generator = new GraphQLFactoryTypeGenerator(graphql, definition)

    // store original and compiled definitions/types
    this._definitions = {
      graphql,
      definition: definition.definition,
      types: generator.types,
      schemas: generator.schemas
    }

    // build schema functions
    _.forEach(generator.schemas, (schema, name) => {
      this[name] = function (requestString, rootValue, contextValue, variableValues, operationName) {
        return graphql.graphql(schema, requestString, rootValue, contextValue, variableValues, operationName)
      }
    })
  }
}