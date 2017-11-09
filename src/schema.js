import _ from 'lodash'
import Translator from './translate/language'
import Backing from './types/backing'
import { getDirectives, isHash } from './common/util'
import { mapDirectives } from './common/tools'
import { buildSchema } from 'graphql'

const OPERATIONS = [ 'query', 'mutation', 'subscription' ]

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
    this._backing = new Backing() // local backing
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
        .translateType(value, _name, this._backing)
      return _name
    } else if (_.isString(value)) {
      return value
    }
    return null
  }

  /**
   * Merges the backing into the schema
   * @param definition
   * @param schema
   * @private
   */
  _mergeBacking (definition, schema) {
    const backing = new Backing()
      .merge(definition.backing)
      .merge(this._backing)

    // get the non directive backing
    const backingTypes = _.omit(backing.backing, [ '@directives' ])

    // set the functions from the function map
    _.forEach(backingTypes, (map, typeName) => {
      const type = _.get(schema, [ '_typeMap', typeName ])
      if (!isHash(map) || !type) return true

      // apply the functions
      _.forEach(map, (value, key) => {
        let path = []
        let func = null
        let wrapMethod = '_bindFunction'
        let infoPath = ''

        // get the function/ref and path
        if (key.match(/^_/)) {
          func = value
          path = [ key.replace(/^_/, '') ]
          infoPath = `${typeName}.${path[0]}`
        } else {
          func = _.get(value, 'resolve')
          path = [ '_fields', key, 'resolve' ]
          wrapMethod = '_wrapResolve'
          infoPath = `${typeName}.${key}.resolve`
        }

        // set the method
        _.set(type, path, this[wrapMethod](func, definition, infoPath))
      })
    })
  }

  /**
   * Wraps a resolver function in middleware
   * @param fn
   * @param definition
   * @param infoPath
   * @returns {Function}
   * @private
   */
  _wrapResolve (fn, definition, infoPath) {
    return function (source, args, context, info) {
      // get the function
      const func = _.isString(fn)
        ? _.get(definition.functions, [ fn ])
        : fn

      // if not a function move on
      if (!_.isFunction(func)) {
        throw new Error('Invalid or missing '
          + 'resolve for "' + infoPath + '"')
      }

      // generate a request object
      const req = {
        source,
        args,
        context,
        info,
        directives: mapDirectives(info)
      }

      return func(source, args, context, info)
    }
  }

  /**
   * Wraps a regular function
   * @param fn
   * @param definition
   * @param infoPath
   * @returns {Function}
   * @private
   */
  _bindFunction (fn, definition, infoPath) {
    return function (...args) {
      // get the function
      const func = _.isString(fn)
        ? _.get(definition.functions, [ fn ])
        : fn

      // if not a function move on
      if (!_.isFunction(func)) {
        throw new Error('Invalid or missing '
          + 'function for "' + infoPath + '"')
      }

      return func.apply({}, [ args ])
    }
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
    this._mergeBacking(definition, schema)
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
    const def = `schema${_directives} {\n${ops.join('\n')}\n}\n`

    return _.isString(this._definition)
      ? `# ${this._definition}`
      : def
  }
}
