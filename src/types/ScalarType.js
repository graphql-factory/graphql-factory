import _ from '../common/lodash.custom'
import { GraphQLScalarType } from 'graphql'

export default function ScalarType (definition) {
  try {
    const def = _.merge({}, definition)
    const { serialize, parseValue, parseLiteral } = definition

    def.serialize = this.bindFunction(serialize, definition)

    if (_.isFunction(parseValue) || _.isString(parseValue)) {
      def.parseValue = this.bindFunction(parseValue, definition)
    }

    if (_.isFunction(parseLiteral) || _.isString(parseLiteral)) {
      def.parseLiteral = this.bindFunction(parseLiteral, definition)
    }

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
