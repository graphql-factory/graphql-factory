import _ from '../common/lodash.custom'
import { GraphQLUnionType } from 'graphql'

export default function UnionType (definition) {
  try {
    const def = _.merge({}, definition)
    const { types, resolveType } = definition

    def.types = () => {
      return _.map(types, type => {
        return _.get(this.types, `["${type}"]`)
      })
    }

    if (_.isFunction(resolveType) || _.isString(resolveType)) {
      def.resolveType = this.bindFunction(resolveType, definition)
    }

    return new GraphQLUnionType(def)
  } catch (err) {
    this.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('UnionType: ' + err.message),
      stack: err.stack
    })
  }
}
