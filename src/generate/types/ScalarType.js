import _ from 'lodash'

export default function ScalarType (definition) {
  try {
    const def = _.merge({}, definition)
    const { GraphQLScalarType } = this.graphql
    const { serialize, parseValue, parseLiteral } = definition

    def.serialize = this.bindFunction(serialize, definition)
    def.parseValue = this.bindFunction(parseValue, definition)
    def.parseLiteral = this.bindFunction(parseLiteral, definition)

    return new GraphQLScalarType(def)
  } catch (err) {
    this.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('ScalarType: ' + err.message),
      stack: err.stack
    })
  }
}
