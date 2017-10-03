export default function FactoryGQLSchema (_this, definition, nameDefault) {
  try {
    let { query, mutation, subscription } = definition

    let schema = new _this.graphql.GraphQLSchema({
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
    console.error('GraphQLFactoryError: FactoryGQLSchema', err)
  }
}