export default {
  type: 'Scalar',
  name: 'Email',
  description: 'The Email scalar type represents E-Mail addresses compliant to RFC 822.',
  serialize (value) {
    return value
  },
  parseValue (value) {
    return value
  },
  parseLiteral (ast) {
    let { GraphQLError, Kind } = this.graphql

    // regex taken from https://github.com/stylesuxx/graphql-custom-types
    let rx = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError('Query error: expected Email to be a string but got a: ' + ast.kind, [ast])
    }

    if (!ast.value.match(rx)) {
      throw new GraphQLError('Query error: invalid Email', [ast])
    }

    return ast.value
  }
}