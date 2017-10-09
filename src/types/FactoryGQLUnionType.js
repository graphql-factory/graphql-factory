import _ from '../utils/index'

export default function FactoryGQLUnionType (_this, definition, nameDefault) {
  try {
    const { name, types, resolveType, description } = definition

    return new _this.graphql.GraphQLUnionType({
      name: name || nameDefault,
      types: _.map(types, type => _this.resolveType(type)),
      resolveType: _this.bindFunction(resolveType, definition, true),
      description
    })
  } catch (err) {
    _this.factory.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('FactoryGQLUnionType: ' + err.message),
      stack: err.stack
    })
  }
}
