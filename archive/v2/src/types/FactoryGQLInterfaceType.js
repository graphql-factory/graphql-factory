import FactoryFieldConfigMapThunk from './FactoryFieldConfigMapThunk'

export default function FactoryGQLInterfaceType (_this, definition, nameDefault) {
  try {
    const { name, fields, resolveType, description } = definition

    return new _this.graphql.GraphQLInterfaceType({
      name: name || nameDefault,
      fields: FactoryFieldConfigMapThunk(_this, fields, 'Interface'),
      resolveType: _this.bindFunction(resolveType, definition, true),
      description
    })
  } catch (err) {
    _this.factory.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('FactoryGQLInterfaceType: ' + err.message),
      stack: err.stack
    })
  }
}
