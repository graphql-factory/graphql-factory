import _ from 'lodash'

export default function UnionType (definition) {
  try {
    const { GraphQLUnionType } = this.graphql
    const def = _.merge({}, definition)
    const { types, resolveType } = definition

    def.types = _.map(types, type => {
      return _.get(this.types, `["${type}"]`)
    })

    def.resolveType = this.bindFunction(resolveType, definition)

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
