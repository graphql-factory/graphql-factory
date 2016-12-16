import FactoryFieldConfigMapThunk from './FactoryFieldConfigMapThunk'

export default function FactoryGQLInterfaceType (_this, definition, nameDefault) {
  let { name, fields, resolveType, description } = definition

  return new _this.graphql.GraphQLInterfaceType({
    name: name || nameDefault,
    fields: FactoryFieldConfigMapThunk(_this, fields, 'Interface'),
    resolveType: _this.bindFunction(resolveType),
    description
  })
}