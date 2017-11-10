import _ from '../common/lodash.custom'
import { reduceDirectives } from '../common/tools'

/**
 * Middleware processing function
 * @param schema
 * @param backing
 * @param definition
 * @param params
 */
export default function processMiddleware (schema, backing, definition, params) {
  const [ source, args, context, info ] = params
  const { parentType, fieldName } = info
  const directives = reduceDirectives(info)

  // console.log('MIDDLEWARE')
  // console.log(directives)
  _.noop(directives, source, args, context, parentType, fieldName)

  return {
    id: '1',
    name: 'John'
  }
  // throw new Error('AHH!')
}
