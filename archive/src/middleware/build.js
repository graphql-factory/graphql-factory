import _ from '../common/lodash.custom'
/**
 * Build middleware is different from request middleware
 * it cannot return a promise and must only modify the definition
 * before the definition is compiled or modify the schema after
 * the schema has been built
 * @param definition
 *
 * beforeBuild (GraphQLFactoryDefinition, GraphQLFactorySchema)
 * afterBuild (GraphQLSchema)
 */
export default function buildMiddleware (definition, schema) {
  let error = null

  // process before build middleware
  _.forEach(definition._beforeBuild, middleware => {
    try {
      middleware(definition, schema)
    } catch (err) {
      error = err
      return false
    }
  })

  // throw any captured errors
  if (error) throw error

  // build the schema instance with the current definition
  const schemaInstance = schema.build(definition)

  // process the after build middleware
  _.forEach(definition._afterBuild, middleware => {
    try {
      middleware(schemaInstance)
    } catch (err) {
      error = err
      return false
    }
  })

  // throw any captured errors
  if (error) throw error

  // return the schema instance
  return schemaInstance
}
