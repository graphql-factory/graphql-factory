import _ from '../common/lodash.custom'

export default class LanguageBuilder {
  constructor (graphql) {
    this.error = null
    this.graphql = graphql
    this.definition = {
      types: {},
      schemas: {}
    }
  }

  /**
   * Builds a factory definition from schema language
   * @param source
   * @param schemaName
   * @param extension
   * @returns {{types: {}, schemas: {}}|*}
   */
  build (source, schemaName, extension) {
    const { parse } = this.graphql
    const { definitions } = parse(source)

    // process each definition
    _.forEach(definitions, def => {
      const { kind } = def
      if (_.isFunction(this[kind])) {
        this[kind](def, schemaName)
      }
    })

    // check for error
    if (this.error) throw this.error

    // merge in the custom data
    _.forEach(extension, (ext, name) => {
      const target = _.get(this.definition, `types["${name}"].fields`)
      if (target) _.merge(target, ext)
    })

    // return the factory definition
    return this.definition
  }

  /**
   * Builds a type string from definition
   * @param typeDef
   * @returns {*}
   * @private
   */
  _buildTypeString (typeDef) {
    const { kind, type, name } = typeDef
    switch (kind) {
      case 'NonNullType':
        return `${this._buildTypeString(type)}!`
      case 'ListType':
        return `[${this._buildTypeString(type)}]`
      default:
        return name.value
    }
  }

  /**
   * Returns a fields/args hash
   * @param fields
   * @returns {*}
   * @private
   */
  _reduceFields (fields) {
    return _.reduce(fields, (accum, field) => {
      const { name, arguments: args, type } = field
      const def = { type: this._buildTypeString(type) }
      if (_.isArray(args) && args.length) def.args = this._reduceFields(args)

      accum[name.value] = def
      return accum
    }, {})
  }

  /**
   * Processes an object type
   * @param definition
   * @constructor
   */
  ObjectTypeDefinition (definition) {
    const { name, interfaces, fields } = definition
    const def = {
      name: name.value,
      fields: this._reduceFields(fields)
    }
    if (interfaces.length) def.interfaces = interfaces
    this.definition.types[def.name] = def
  }

  /**
   * Processes a schema type
   * @param definition
   * @param schemaName
   * @constructor
   */
  SchemaDefinition (definition, schemaName) {
    if (!_.isString(schemaName) || schemaName === '') {
      this.error = new Error('GraphQLFactoryLanguageError: '
        + 'Schema name must be provided as third argument '
        + 'in use when using schema definition language to '
        + 'define a schema')
    }
    const { operationTypes } = definition
    const def = _.reduce(operationTypes, (accum, opDef) => {
      const { operation, type } = opDef
      accum[operation] = _.get(type, 'name.value')
      return accum
    }, {})
    this.definition.schemas[schemaName] = def
  }
}
