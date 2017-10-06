export default function FactoryGQLSchema (_this, definition, nameDefault) {
  try {
    const { query, mutation, subscription } = definition

    const schema = new _this.graphql.GraphQLSchema({
      query: _this.types[query],
      mutation: _this.types[mutation],
      subscription: _this.types[subscription]
    })

    schema._factory = {
      key: nameDefault,
      query: _this.definition.getType(query),
      mutation: _this.definition.getType(mutation),
      subscription: _this.definition.getType(subscription)
    }

    return schema
  } catch (err) {
    _this.factory.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('FactoryGQLSchema: ' + err.message),
      stack: err.stack
    })
  }
}
