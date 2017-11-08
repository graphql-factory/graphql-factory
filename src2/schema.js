import _ from 'lodash'
import Translator from './translate'
import { getDirectives, isHash } from './util'
import { buildSchema } from 'graphql'

const OPERATIONS = ['query', 'mutation', 'subscription']

export default class GraphQLFactorySchema {
  constructor (definition, nameDefault) {
    const {
      name,
      query,
      mutation,
      subscription,
      description,
      directives
    } = definition

    this._definition = definition
    this._description = description
    this._rootTypes = {}
    this._functionMap = {}
    this._directives = directives
    this._types = {}
    this.name = name || nameDefault
    this.query = this._addRootType('query', query)
    this.mutation = this._addRootType('mutation', mutation)
    this.subscription = this._addRootType('subscription', subscription)
  }

  /**
   * add the root type to the schema context if it is defined
   * on the schema. Otherwise add the name of the rootType
   * @param type
   * @param value
   * @returns {*}
   * @private
   */
  _addRootType (type, value) {
    if (_.isObject(value) && !_.isArray(value)) {
      const { name } = value
      const _name = name || _.capitalize(type)
      this._rootTypes[_name] = new Translator()
        .translateType(value, _name, this._functionMap)
      return _name
    } else if (_.isString(value)) {
      return value
    } else {
      return null
    }
  }

  /**
   * Merges the functionMap into the schema
   * @param functions
   * @param functionMap
   * @param schema
   * @private
   */
  _mergeFunctions (definition, schema) {
    const functions = _.get(definition, 'functions', {})
    const functionMap = _.assign(
      {},
      _.get(definition, 'functionMap', {}),
      this._functionMap
    )

    // set the functions from the function map
    _.forEach(functionMap, (map, typeName) => {
      const type = _.get(schema, ['_typeMap', typeName])
      if (!isHash(map) || !type) return true

      // apply the functions
      _.forEach(map, (value, key) => {
        // get the function if its a reference
        const _value = _.isString(value)
          ? _.get(functions, [value])
          : value

        // if the value is a function, bind it
        if (_.isFunction(_value)) {
          _.set(type, [key], this._bindFunction(value, definition))
        } else if (key === 'fields') {
          // map the fields
          _.forEach(_value, (resolve, field) => {
            const _resolve = _.isString(resolve)
              ? _.get(functions, [resolve])
              : resolve
            if (_.isFunction(_resolve)) {
              _.set(
                type,
                ['_fields', field, 'resolve'],
                this._wrapResolve(resolve, definition)
              )
            }
          })
        }
      })
    })
  }

  _wrapResolve (fn, definition) {
    return fn
  }

  _bindFunction (fn, definition) {
    return fn
  }

  /**
   * Add types to the schema
   * @param types
   */
  addTypes (types) {
    if (isHash(types)) _.assign(this._types, types)
    return this
  }

  /**
   * Creates a complete schema definition
   * @param types
   * @returns {string|*}
   */
  export (types) {
    this.addTypes(types)
    return this.document
  }

  /**
   * Builds a schema
   * @param definition
   */
  build (definition) {
    // TODO: determine a way to merge in the directives in a schema
    const types = _.get(definition, 'types', {})
    const document = this.export(types)
    const schema = buildSchema(document)
    this._mergeFunctions(definition, schema)
    return schema
  }

  /**
   * Create a complete .graphql document
   * @returns {string|*}
   */
  get document () {
    // join the type map with the schema definition
    const _types = _.assign({}, this._types, this._rootTypes)
    return _.map(_types, value => value)
      .concat(this.definition)
      .join('\n')
  }

  /**
   * Generates the schema definition
   * @returns {string}
   */
  get definition () {
    const _directives = getDirectives(this._definition)
    const ops = _.reduce(OPERATIONS, (accum, operation) => {
      if (this[operation]) {
        accum.push(`  ${operation}: ${this[operation]}`)
      }
      return accum
    }, [])
    const def = `schema${_directives} {\n${ops.join('\n')}\n\}\n`

    return _.isString(this._definition)
      ? `# ${this._definition}`
      : def
  }
}