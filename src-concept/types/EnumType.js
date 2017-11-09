import { GraphQLEnumType } from 'graphql'

export default function EnumType (definition) {
  try {
    return new GraphQLEnumType(definition)
  } catch (err) {
    this.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('EnumType: ' + err.message),
      stack: err.stack
    })
  }
}
