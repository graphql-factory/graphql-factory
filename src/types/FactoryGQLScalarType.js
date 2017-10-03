export default function FactoryGQLScalarType (_this, definition, nameDefault) {
  try {
    let { name, description, serialize, parseValue, parseLiteral } = definition

    return new _this.graphql.GraphQLScalarType({
      name: name || nameDefault,
      description,
      serialize: _this.bindFunction(serialize, definition),
      parseValue: _this.bindFunction(parseValue, definition),
      parseLiteral: _this.bindFunction(parseLiteral, definition)
    })
  } catch (err) {
    console.error('GraphQLFactoryError: FactoryGQLScalarType', err)
  }
}