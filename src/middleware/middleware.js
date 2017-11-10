/**
 * Middleware processing function
 * @param schema
 * @param backing
 * @param definition
 * @param params
 */
export default function processMiddleware (schema, backing, definition, params) {
  // const [ source, args, context, info ] = params
  // const { parentType, fieldName } = info
  // console.log(parentType._fields[fieldName])
  // console.log(info.schema._factory)

  // nonsense for temporary lint pass
  if (schema === 1) return { backing, definition, params }
  throw new Error('AHH!')
}
