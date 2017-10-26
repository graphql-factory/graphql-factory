import _ from '../common/lodash.custom'
import EventEmitter from 'events'

export default class GraphQLFactoryLibrary extends EventEmitter {
  constructor (graphql, registry, generator) {
    super()
    this.graphql = graphql
    this.registry = registry
    this._bindResolver = resolve => {
      generator.bindResolve(resolve, {})
    }
  }

  /**
   * Makes a graphql request
   * @param schemaOrArgs
   * @param requestStr
   * @param root
   * @param context
   * @param variables
   * @param operation
   * @param resolver
   * @returns {*}
   */
  request (
    schemaOrArgs,
    requestStr,
    root,
    context,
    variables,
    operation,
    resolver
  ) {
    const { graphql, GraphQLSchema } = this.graphql
    const { schemas } = this.registry

    // store the arguments
    let _schema = schemaOrArgs
    let _request = requestStr
    let _root = root
    let _context = context
    let _variables = variables
    let _operation = operation
    let _resolver = resolver

    // if the first argument is an object
    // use it as an arguments hash
    if (_.isObject(schemaOrArgs) && schemaOrArgs !== null) {
      _schema = schemaOrArgs.schema
      _request = schemaOrArgs.requestString
      _root = schemaOrArgs.rootValue
      _context = schemaOrArgs.contextValue
      _variables = schemaOrArgs.variableValues
      _operation = schemaOrArgs.operationName
      _resolver = schemaOrArgs.fieldResolver

    }

    // get the schema
    const schema = _.get(schemas, `["${_schema}"]`)

    // check for schema
    if (!(schema instanceof GraphQLSchema)) {
      throw new Error('GraphQLFactoryError: Schema "'
        + _schema + '" was not found in the registry')
    }

    // bind the default resolver to the middleware
    _resolver = _.isFunction(_resolver)
      ? this._bindResolver(_resolver)
      : _resolver

    // make the request
    return graphql(
      schema,
      _request,
      _root,
      _context,
      _variables,
      _operation,
      _resolver
    )
  }
}
