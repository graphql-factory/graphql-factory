export default function FactoryGQLScalarType (_this, definition, nameDefault) {
  try {
    const { name, description, serialize, parseValue, parseLiteral } = definition

    return new _this.graphql.GraphQLScalarType({
      name: name || nameDefault,
      description,
      serialize: _this.bindFunction(serialize, definition, true),
      parseValue: _this.bindFunction(parseValue, definition, true),
      parseLiteral: _this.bindFunction(parseLiteral, definition, true)
    })
  } catch (err) {
    _this.factory.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('FactoryGQLScalarType: ' + err.message),
      stack: err.stack
    })
  }
}
