import _ from 'lodash'

export default function Schema (definition, name) {
  try {
    const def = _.merge({}, definition)
    const { GraphQLSchema } = this.graphql
    const { query, mutation, subscription } = definition

    def.query = _.get(this.types, `["${query}"]`)

    if (mutation) {
      def.mutation = _.get(this.types, `["${mutation}"]`)
    }

    if (subscription) {
      def.subscription = _.get(this.types, `["${subscription}"]`)
    }

    // create a new schema object
    const schema = new GraphQLSchema(def)

    // attach some info to the schema object
    schema._factory = {
      schemaName: name,
      query: this._def.getType(query),
      mutation: this._def.getType(mutation),
      subscription: this._def.getType(subscription)
    }

    return schema
  } catch (err) {
    this.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('Schema: ' + err.message),
      stack: err.stack
    })
  }
}
