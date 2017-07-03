import _ from './utils/index'
import EventEmitter from 'events'
import GraphQLFactoryTypeGenerator from './types/GraphQLFactoryTypeGenerator'

export default class GraphQLFactoryLibrary extends EventEmitter {
  constructor (graphql, definition, options) {
    super()
    options = _.isHash(options) ? options : {}
    let { types, schemas } = new GraphQLFactoryTypeGenerator(graphql, definition, this, options)

    // store original and compiled definitions/types
    this._definitions = {
      definition: definition.definition,
      graphql,
      schemas,
      types
    }

    // build schema functions
    _.forEach(schemas, (schema, name) => {
      this[name] = function (requestString, rootValue, contextValue, variableValues, operationName) {
        return graphql.graphql(schema, requestString, rootValue, contextValue, variableValues, operationName)
      }
    })
  }
}