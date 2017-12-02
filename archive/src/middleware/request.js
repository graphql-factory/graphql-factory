import _ from '../common/lodash.custom'
import { reduceDirectives, filterDirectives } from '../common/tools'
import { SchemaOperation } from '../common/const'

/**
 * Middleware processing function
 * @param schema
 * @param backing
 * @param definition
 * @param params
 */
export default function processMiddleware (schema, backing, definition, params) {
  const [ source, args, context, info ] = params
  const { parentType, fieldName, operation: { operation } } = info
  const directives = reduceDirectives(info)

  console.log('DIRECTIVES')
  directives.forEach(({ name, args, location }) => {
    console.log({ name, args, location })
  })

  //console.log(directives)
  //
  switch (operation) {
    case SchemaOperation.QUERY:
      break

    case SchemaOperation.MUTATION:
      break

    case SchemaOperation.SUBSCRIPTION:
      break

    default:
      break
  }

  _.noop(directives, source, args, context, parentType, fieldName)

  return {
    id: '1',
    name: 'John'
  }
  // throw new Error('AHH!')
}
