/**
 * This module converts graphql factory definitions
 * into schema language + a backing
 */
import _ from '../common/lodash.custom'
import Definition from '../definition/definition'
import Backing from '../generate/backing'
import Directive from '../types/directive'
import Schema from '../generate/schema'
import { Kind, DirectiveLocation } from 'graphql'
import {
  toArgs,
  isHash,
  getDirectives,
  indent,
  stringValue
} from '../common/util'

export default class GraphQLFactoryDefinitionTranslator {
  constructor () {
    this.definition = new Definition()
  }

  /**
   * generic type composer
   * @param typeDef
   * @param typeName
   * @returns {string}
   * @private
   */
  _type (typeDef, typeName) {
    const { name, type, description } = typeDef

    const parts = {
      name: name || typeName,
      directives: getDirectives(typeDef)
    }

    const def = this[`_${type || 'Object'}`](typeDef, parts)

    return _.isString(description)
      ? `# ${description}\n${def}`
      : def
  }

  /**
   * Adds a backing function
   * @param typeDef
   * @param typeName
   * @param fnName
   * @private
   */
  _registerFunction (typeDef, typeName, fnName) {
    const type = typeDef.type || 'Object'
    const fn = _.get(typeDef, [ fnName ])
    if (_.isFunction(fn) || _.isString(fn)) {
      this.definition.backing[type][fnName](typeName, fn)
    }
  }

  /**
   * Creates a directive
   * @private
   */
  _Directive (definition, directiveName) {
    const {
      name,
      description,
      locations,
      args,
      before,
      after,
      error
    } = definition
    const _name = name || directiveName
    const _args = this._arguments(args, 1)
    const _locations = _.filter(locations, _.isString)
    const _loc = _locations.length
      ? _locations.join(' | ')
      : _.values(DirectiveLocation).join(' | ')

    // add the custom object as a directive backing
    this.definition.backing.Directive(_name, new Directive({
      name: _name,
      description,
      locations: locations || _.values(DirectiveLocation),
      before,
      after,
      error
    }))

    // build the directive string
    const directive = `directive @${_name}${_args} on ${_loc}\n`

    // return the schema definition
    return _.isString(description)
      ? `# ${description}\n${directive}`
      : directive
  }

  /**
   * Creates a union
   * @param typeDef
   * @param name
   * @param directives
   * @returns {string}
   * @private
   */
  _Union (typeDef, { name }) {
    this._registerFunction(typeDef, name, 'resolveType')
    const { types } = typeDef
    const _types = _.isFunction(types) ? types() : types
    return `union ${name} = ${_types.join(' | ')}\n`
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
    const fields = this._fields(typeDef)
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
    const fields = this._fields(typeDef, name)
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
    const fields = this._fields(typeDef, name)
    return `interface ${name}${directives} {\n${fields}\n}\n`
  }

  /**
   * Process subfields
   * @param parentType
   * @param fields
   * @param parent
   * @returns {string|*}
   * @private
   */
  _fields ({ type: parentType, fields }, parent, tabs = 1) {
    const _parentType = parentType || 'Object'
    return _.map(fields, (def, name) => {
      const definition = isHash(def)
        ? _parentType === 'input'
          ? _.omit(def, [ 'args', 'resolve', 'deprecationReason' ])
          : _.omit(def, [ 'defaultValue' ])
        : { type: def }
      const {
        type,
        args,
        resolve,
        deprecationReason,
        description,
        defaultValue
      } = definition

      // add resolve backing
      if (_.isFunction(resolve) || stringValue(resolve)) {
        this.definition.backing[_parentType]
          .resolve(parent, name, resolve)
      }

      const _directives = getDirectives(definition, deprecationReason)
      const _default = defaultValue !== undefined
        ? ` = ${toArgs(defaultValue, true)}`
        : ''
      const _args = this._arguments(args)
      const field = `${indent(tabs)}${name}${_args}: ${type}${_default}${_directives}`

      return _.isString(description)
        ? `${indent(tabs)}# ${description}\n${field}`
        : field
    }).join('\n')
  }

  /**
   * Process arguments
   * @param args
   * @returns {*}
   * @private
   */
  _arguments (args, tabs = 2) {
    if (!args || !_.keys(args).length) return ''
    const _args = _.map(args, (arg, name) => {
      const definition = isHash(arg)
        ? arg
        : { type: arg }
      const { type, defaultValue, description } = definition
      const _directives = getDirectives(definition)
      const _default = defaultValue === undefined
        ? ''
        : ` = ${toArgs(defaultValue)}`
      const a = `${indent(tabs)}${name}: ${type}${_default}${_directives}`
      return _.isString(description)
        ? `${indent(tabs)}# ${description}\n${a}`
        : a
    }).join(',\n')
    return `(\n${_args}\n${indent(tabs - 1)})`
  }

  /**
   * Generates values for an enum
   * @param values
   * @returns {string|*}
   * @private
   */
  _values (values, tabs = 1) {
    return _.map(values, (def, name) => {
      const definition = isHash(def)
        ? def
        : {}
      const { deprecationReason, description } = definition
      const _directives = getDirectives(definition, deprecationReason)
      const v = `${indent(tabs)}${name}${_directives}`
      return _.isString(description)
        ? `${indent(tabs)}# ${description}\n${v}`
        : v
    }).join('\n')
  }

  /**
   * Translate a single type and return its value
   * @param typeDef
   */
  translateType (typeDef, typeName, backing) {
    // re-point the function map
    if (backing instanceof Backing) this.definition.backing = backing
    else if (isHash(backing)) this.definition.backing = new Backing(backing)
    return this._type(typeDef, typeName)
  }

  /**
   * Translates the factory definition
   * @param factoryDefinition
   */
  translate (factoryDefinition) {
    _.forEach(factoryDefinition, (store, storeType) => {
      switch (storeType) {
        case 'backing':
          this.definition.backing.merge(store)
          break

        case 'functions':
        case 'context':
          _.assign(this.definition[storeType], store)
          break

        case 'types':
          _.forEach(store, (typeDef, typeName) => {
            if (typeName.match(/^@/)) return true
            this.definition.addKind(
              Kind.OBJECT_TYPE_DEFINITION,
              _.get(typeDef, 'name', typeName),
              this._type(typeDef, typeName)
            )
          })
          break

        case 'schemas':
          _.forEach(store, (schemaDef, schemaName) => {
            if (schemaName.match(/^@/)) return true
            this.definition.addKind(
              Kind.SCHEMA_DEFINITION,
              _.get(schemaDef, 'name', schemaName),
              new Schema(schemaDef, schemaName)
            )
          })
          break

        case 'directives':
          _.forEach(store, (directiveDef, directiveName) => {
            this.definition.addKind(
              Kind.DIRECTIVE_DEFINITION,
              _.get(directiveDef, 'name', directiveName),
              this._Directive(directiveDef, directiveName)
            )
          })
          break

        default:
          break
      }
    })

    return this.definition
  }
}
