export default function FactoryGQLSchema (_this, definition, nameDefault) {
  try {
    const { name, query, mutation, subscription } = definition

    if (!_this.types || !_this.types[query]) {
      throw new Error(`Type "${query}" not found`)
    }

    const schema = new _this.graphql.GraphQLSchema({
      name: name || nameDefault,
      query: _this.types[query],
      mutation: _this.types[mutation],
      subscription: _this.types[subscription]
    })

    schema._factory = {
      name: name || nameDefault,
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
