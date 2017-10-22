import _ from 'lodash'
import EventEmitter from 'events'
import EnumType from './types/EnumType'
import ObjectType from './types/ObjectType'
import InputObjectType from './types/InputObjectType'
import InterfaceType from './types/InterfaceType'
import UnionType from './types/UnionType'
import ScalarType from './types/ScalarType'
import Schema from './types/Schema'
import TypeDependency from './dependency'
import {
  BOOLEAN,
  INT,
  STRING,
  FLOAT,
  ID,
  ENUM,
  SCALAR,
  OBJECT,
  INPUT,
  INTERFACE,
  UNION
} from '../common/const'

export default class Generator extends EventEmitter {
  constructor (graphql, lib) {
    super()
    this.lib = lib
    this.graphql = graphql
    this.error = null
    this._def = {}
    this.types = {}
    this.schemas = {}
    this.functions = {}
    this._toResolve = {}
    this._context = {}
    this._scalars = {
      [BOOLEAN]: graphql.GraphQLBoolean,
      [INT]: graphql.GraphQLInt,
      [STRING]: graphql.GraphQLString,
      [FLOAT]: graphql.GraphQLFloat,
      [ID]: graphql.GraphQLID
    }
  }

  /**
   * Makes a context object
   * @param definition
   * @private
   */
  _makeContext (definition) {
    this._context = {
      lib: this.lib,
      definition: definition.definition,
      globals: definition.plugin.globals,
      graphql: this.graphql,
      lodash: _,
      types: this.types,
      schemas: this.schemas
    }

    // add plugin context values
    _.forEach(definition._pluginRegistry, p => {
      const ctx = _.get(p, 'context')
      if (ctx) this._context = _.assign(this._context, ctx)
    })
  }

  /**
   * Resolves the current resolvable types
   * @private
   */
  _resolveTypes () {
    if (this.error) return

    const types = _.keys(this.types)
    const canResolve = []
    const unresolved = _.keys(this._toResolve).length
    if (!unresolved) return

    // build a list of types that can be resolved
    _.forEach(this._toResolve, (deps, name) => {
      const count = deps.length
      const matches = _.intersection(types, deps)
      if (count === 0 || matches.length === count) {
        canResolve.push(name)
      }
    })

    // if there are no resolve matches
    if (!canResolve.length) {
      // check if there is anything left to resolve
      // if there is that means there are unresolvable types
      if (unresolved) {
        this.error = new Error('GraphQLFactoryGenerateError: '
          + 'Failed to resolve [ '
          + _.keys(this._toResolve).join(', ')
          + ' ]')
      }
      return
    }

    // attempt to resolve the types
    _.forEach(canResolve, typeName => {
      this._buildType(typeName)
    })

    // attempt to resolve the remaining types
    this._resolveTypes()
  }

  /**
   * Creates schemas
   * @private
   */
  _resolveSchemas () {
    _.forEach(this._def.schemas, (def, name) => {
      this.schemas[name] = Schema(def, name)
    })
  }

  /**
   * Builds a Type using the appropriate builder
   * @param typeName
   * @private
   */
  _buildType (typeName) {
    if (this.error) return

    const typeDef = _.get(this._def, `types["${typeName}"]`)

    if (!typeDef) {
      this.error = new Error('GraphQLFactoryGenerateError: '
        + 'No definition for type "' + typeName + '"')
      return
    }

    // build the appropriate type
    switch (typeName) {
      case ENUM:
        this.types[typeName] = EnumType.call(this, typeDef)
        break

      case OBJECT:
        this.types[typeName] = ObjectType.call(this, typeDef)
        break

      case INPUT:
        this.types[typeName] = InputObjectType.call(this, typeDef)
        break

      case INTERFACE:
        this.types[typeName] = InterfaceType.call(this, typeDef)
        break

      case UNION:
        this.types[typeName] = UnionType.call(this, typeDef)
        break

      case SCALAR:
        this.types[typeName] = ScalarType.call(this, typeDef)
        break

      default:
        this.error = new Error('GraphQLFactoryGenerateError: "'
          + typeName + '" is not a valid graphql type to generate')
        return
    }

    // remove the type from the toResolve hash
    _.unset(this._toResolve, `["${typeName}"]`)
  }

  /**
   * Binds context and middleware to a field resolve
   * @param fn
   * @param def
   */
  bindResolve (fn, def) {

  }

  /**
   * Binds context to a function
   * @param fn
   * @param def
   */
  bindFunction (fn, fieldDef) {
    const func = _.isString(fn)
      ? _.get(this.functions, `["${fn}"]`)
      : fn
    const ctx = _.assign({}, this._context, { fieldDef })

    if (!_.isFunction(func)) {
      this.error = new Error('GraphQLFactoryGenerateError: No function found')
      return
    }

    return function () {
      return func.apply(ctx, [...arguments])
    }
  }

  /**
   * Makes a new type from a field def
   * @param field
   */
  makeType (field) {
    const { type, nullable } = field
    const isList = _.isArray(type)
    const isNonNull = nullable === false
    const typeName = _.first(_.castArray(type))
    let type = _.get(
      this.types,
      `["${typeName}"]`,
      _.get(this._scalars, `["${typeName}"]`)
    )

    if (!type) {
      this.error = new Error('GraphQLFactoryGenerateError: ' +
        'Cannot make type "' + typeName + '"')
    }

    type = isList
      ? new this.graphql.GraphQLList(type)
      : type

    type = isNonNull
      ? this.graphql.GraphQLNonNull(type)
      : type

    return type
  }

  /**
   * Generates types and schemas
   * @param definition
   */
  generate (definition) {
    this._def = definition
    this.functions = definition._functions
    this._toResolve = new TypeDependency().graph(definition)

    // resolve types then schemas
    this._resolveTypes()
    this._resolveSchemas()

    return this
  }
}