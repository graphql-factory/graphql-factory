import _ from '../common/lodash.custom'
import Translator from '../translate/language'
import Backing from './backing'
import { getDirectives, isHash } from '../common/util'
import { SchemaOperations } from '../common/const'
import * as graphql from 'graphql'
const { buildSchema } = graphql

export default class GraphQLFactorySchema {
  constructor (schemaDefinition, nameDefault) {
    const {
      name,
      query,
      mutation,
      subscription,
      description,
      directives
    } = schemaDefinition

    this._definition = schemaDefinition
    this._description = description
    this._rootTypes = {}
    this._backing = new Backing() // local backing
    this._directives = _.isArray(directives)
      ? directives
      : []
    this._types = {}
    this.name = name || nameDefault
    this.query = this._addRootType(
      SchemaOperations.QUERY,
      query
    )
    this.mutation = this._addRootType(
      SchemaOperations.MUTATION,
      mutation
    )
    this.subscription = this._addRootType(
      SchemaOperations.SUBSCRIPTION,
      subscription
    )
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
        .translateType(value, _name, this._backing)
      return _name
    } else if (_.isString(value)) {
      return value
    }
    return null
  }

  /**
   * Creates a complete schema definition
   * @param types
   * @returns {string|*}
   */
  export (definition) {
    if (!isHash(definition)) throw new Error('ExportError: Invalid definition')

    // deconstruct the definition
    const {
      types: _types,
      directives: _directives,
      backing: _backing
    } = definition

    // create a new backing and merge the existing
    const backing = new Backing()
      .merge(_backing)
      .merge(this._backing)

    // merge the types
    const types = _.assign({}, _types, this._rootTypes)

    // reduce the directives to the required ones
    const directives = _.reduce(
      _.uniq(this._directives),
      (directiveList, directive) => {
        if (_.has(_directives, [ directive ])) {
          directiveList.push(_directives[directive])
        }
        return directiveList
      },
      []
    )

    // create the document
    const document = _.values(types)
      .concat(directives)
      .concat(this.definition)
      .join('\n')

    // "export" the document and backing
    return { document, backing }
  }

  /**
   * Builds a schema
   * @param definition
   */
  build (definition) {
    // export the document
    const { document, backing } = this.export(definition)

    // create a schema object from the document
    const schema = buildSchema(document)

    // merge the definition backing with the local
    // and hydrate the schema with it
    return backing.hydrateSchema(schema, definition)
  }

  /**
   * Generates the schema definition
   * @returns {string}
   */
  get definition () {
    const _directives = getDirectives(this._definition)
    const ops = _.reduce(SchemaOperations._values, (accum, operation) => {
      if (this[operation]) {
        accum.push(`  ${operation}: ${this[operation]}`)
      }
      return accum
    }, [])
    const def = `schema${_directives} {\n${ops.join('\n')}\n}\n`

    return _.isString(this._definition)
      ? `# ${this._definition}`
      : def
  }
}
