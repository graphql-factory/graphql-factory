export default {
  type: 'Scalar',
  name: 'Base64',
  description: 'Converts value to and from base64',
  serialize (value) {
    return (new Buffer(value, 'base64')).toString()
  },
  parseValue (value) {
    return (new Buffer(value)).toString('base64')
  },
  parseLiteral (ast) {
    const { GraphQLError, Kind } = this.graphql

    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError('Query error: expected Base64 '
        + 'to be a string but got a: ' + ast.kind, [ ast ])
    }

    return (new Buffer(ast.value)).toString('base64')
  }
}
