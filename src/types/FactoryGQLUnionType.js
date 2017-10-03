import _ from '../utils/index'

export default function FactoryGQLUnionType (_this, definition, nameDefault) {
  try {
    let { name, types, resolveType, description } = definition

    return new _this.graphql.GraphQLUnionType({
      name: name || nameDefault,
      types: _.map(types, (type) => _this.resolveType(type)),
      resolveType: _this.bindFunction(resolveType, definition),
      description
    })
  } catch (err) {
    console.error('GraphQLFactoryError: FactoryGQLUnionType', err)
  }
}