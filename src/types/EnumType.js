export default function EnumType (definition) {
  try {
    const { GraphQLEnumType } = this.graphql
    return new GraphQLEnumType(definition)
  } catch (err) {
    console.log(err)
    this.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('EnumType: ' + err.message),
      stack: err.stack
    })
  }
}