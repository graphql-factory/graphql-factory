import _ from 'lodash'
import Definition from './definition'
import { Kind } from 'graphql'
import { toArgs, isHash } from './util'

export default class GraphQLFactoryTranslator {
  constructor (factory) {
    this.definition = new Definition(factory)
  }

  /**
   * generic type composer
   * @param typeDef
   * @param typeName
   * @returns {string}
   * @private
   */
  _type (typeDef, typeName) {
    const { name, type, description, directives } = typeDef

    const parts = {
      name: name || typeName,
      directives: this._getDirectives(directives)
    }

    const def = this[`_${type || 'Object'}`](typeDef, parts)

    return _.isString(description)
      ? `# ${description}\n${def}`
      : def
  }

  /**
   * Gets a string of directives
   * @param directives
   * @param reason
   * @returns {*}
   * @private
   */
  _getDirectives (directives, reason) {
    const _directives = _.isObject(directives) && !_.isArray(directives)
      ? directives
      : {}
    if (_.isString(reason)) _directives.deprecated = { reason }
    if (!_.keys(_directives).length) return ''

    return ' ' + _.map(_directives, (value, name) => {
      return value === undefined || value === ''
        ? `@${name}`
        : `@${name}(${toArgs(value, true)})`
    }).join(' ')
  }

  /**
   * Registers a function in the functionMap
   * @param typeDef
   * @param typeName
   * @param fnName
   * @private
   */
  _registerFunction (typeDef, typeName, fnName) {
    const fn = _.get(typeDef, [fnName])
    if (_.isFunction(fn) || _.isString(fn)) {
      _.set(this.definition, ['functionMap', typeName, fnName], fn)
    }
  }

  /**
   * Creates a union
   * @param typeDef
   * @param name
   * @param directives
   * @returns {string}
   * @private
   */
  _Union (typeDef, { name, directives }) {
    this._registerFunction(typeDef, name, 'resolveType')
    const { types } = typeDef
    const _types = _.isFunction(types) ? types() : types
    return `union ${name} ${_types.join(' | ')}${directives}\n`
  }

  /**
   * creates a scalar
   * @param typeDef
   * @param name
   * @param directives
   * @returns {string}
   * @private
   */
  _Scalar (typeDef, { name, directives }) {
    this._registerFunction(typeDef, name, 'serialize')
    this._registerFunction(typeDef, name, 'parseValue')
    this._registerFunction(typeDef, name, 'parseLiteral')
    return `scalar ${name}${directives}\n`
  }

  /**
   * Creates an enum
   * @param values
   * @param name
   * @param directives
   * @returns {string}
   * @private
   */
  _Enum ({ values }, { name, directives }) {
    const _values = this._values(values)
    return `enum ${name}${directives} {\n${_values}\n}\n`
  }

  /**
   * Create input def
   * @param typeDef
   * @param name
   * @param directives
   * @returns {string}
   * @private
   */
  _Input (typeDef, { name, directives }) {
    const fields = this._subFields(typeDef)
    return `input ${name}${directives} {\n${fields}\n}\n`
  }

  /**
   * Create an object def
   * @param typeDef
   * @param name
   * @param directives
   * @returns {string}
   * @private
   */
  _Object (typeDef, { name, directives }) {
    this._registerFunction(typeDef, name, 'isTypeOf')
    const { interfaces } = typeDef
    const fields = this._subFields(typeDef, name)
    const _interfaces = _.isFunction(interfaces)
      ? interfaces()
      : interfaces
    const _iface = _.isArray(_interfaces) && _interfaces.length
      ? ` implements ${_iface.join(', ')}`
      : ''
   return `type ${name}${_iface}${directives} {\n${fields}\n}\n`
  }

  /**
   * Create an interface def
   * @param typeDef
   * @param name
   * @param directives
   * @returns {string}
   * @private
   */
  _Interface (typeDef, { name, directives }) {
    this._registerFunction(typeDef, name, 'resolveType')
    const fields = this._subFields(typeDef, name)
    return `interface ${name}${directives} {\n${fields}\n}`
  }

  /**
   * Process subfields
   * @param parentType
   * @param fields
   * @param parent
   * @returns {string|*}
   * @private
   */
  _subFields ({ type: parentType, fields }, parent) {
    return _.map(fields, (def, name) => {
      const {
        type,
        args,
        resolve,
        deprecationReason,
        description,
        defaultValue,
        directives
      } = isHash(def)
        ? parentType === 'input'
          ? _.omit(def, ['args', 'resolve', 'deprecationReason'])
          : _.omit(def, ['defaultValue'])
        : { type: def }

      if (_.isFunction(resolve)) {
        _.set(this.definition, ['functionMap', parent, name], resolve)
      }
      const _directives = this._getDirectives(directives, deprecationReason)
      const _default = defaultValue !== undefined
        ? ` = ${toArgs(defaultValue, true)}`
        : ''
      const _args = this._arguments(args)
      const field = `  ${name}${_args}: ${type}${_default}${_directives}`

      return _.isString(description)
        ? `  # ${description}\n${field}`
        : field
    }).join('\n')
  }

  /**
   * Process arguments
   * @param args
   * @returns {*}
   * @private
   */
  _arguments (args) {
    if (!args || !_.keys(args).length) return ''
    const _args = _.map(args, (arg, name) => {
      const { type, defaultValue, description, directives } = isHash(arg)
        ? arg
        : { type: arg }
      const _directives = this._getDirectives(directives)
      const _default = defaultValue === undefined
        ? ''
        : ` = ${toArgs(defaultValue)}`
      const a = `    ${name}: ${type}${_default}${_directives}`
      return _.isString(description)
        ? `    # ${description}\n${a}`
        : a
    }).join(',\n')
    return `(\n${_args}\n  )`
  }

  /**
   * Generates values for an enum
   * @param values
   * @returns {string|*}
   * @private
   */
  _values (values) {
    return _.map(values, (def, name) => {
      const { deprecationReason, description, directives } = isHash(def)
        ? def
        : {}
      const _directives = this._getDirectives(directives, deprecationReason)
      const v = `  ${name}${_directives}`
      return _.isString(description)
        ? `  # ${description}\n${v}`
        : v
    }).join('\n')
  }

  /**
   * Translates the factory definition
   * @param factoryDefinition
   */
  translate (factoryDefinition) {
    _.forEach(factoryDefinition, (store, storeType) => {
      switch (storeType) {
        case 'functionMap':
        case 'functions':
          break
        case 'context':
          _.assign(this.definition.context, store)
          break

        case 'before':
        case 'after':
        case 'error':
          this.definition[storeType] = store.slice()
          break

        case 'types':
          _.forEach(store, (typeDef, typeName) => {
            this.definition.addKind(
              Kind.OBJECT_TYPE_DEFINITION,
              typeName,
              this._type(typeDef, typeName)
            )
          })
          break;

        case 'schemas':
          break

        default:
          break
      }
    })

    return this.definition
  }
}