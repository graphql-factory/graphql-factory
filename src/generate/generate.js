import _ from '../common/lodash.custom'
import EventEmitter from 'events'
import middleware from './middleware'
import Library from './library'
import { toObjectType } from '../common/util'
import {
  EnumType,
  InputObjectType,
  InterfaceType,
  ObjectType,
  ScalarType,
  Schema,
  UnionType
} from '../types/index'
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
  UNION,
  RANDOM_MAX
} from '../common/const'

export default class Generator extends EventEmitter {
  constructor (graphql) {
    super()
    this.graphql = graphql
    this.error = null
    this._id = String(_.random(RANDOM_MAX))
    this._def = {}
    this.types = {}
    this.schemas = {}
    this.functions = {}
    this._context = {}
    this._scalars = {
      [BOOLEAN]: graphql.GraphQLBoolean,
      [INT]: graphql.GraphQLInt,
      [STRING]: graphql.GraphQLString,
      [FLOAT]: graphql.GraphQLFloat,
      [ID]: graphql.GraphQLID
    }

    // create a read only registry
    const registry = Object.freeze({
      types: this.types,
      schemas: this.schemas,
      definition: this._def.definition
    })

    // create a new library and pass
    // the registry and this generator
    this.lib = Object.freeze(
      new Library(graphql, registry, this)
    )
  }

  /**
   * Makes a context object
   * @param definition
   * @private
   */
  _makeContext (def) {
    const { definition, _context } = def
    const context = _.assign({}, _context)

    // add the plugin context
    _.forEach(definition._pluginRegistry, p => {
      _.assign(context, _.get(p, 'context', {}))
    })

    // finally add the default context values
    this._context = _.assign(context, {
      lib: this.lib,
      graphql: this.graphql
    })

    return this
  }

  /**
   * Resolves the current resolvable types
   * @private
   */
  _makeTypes (types) {
    _.forEach(types, (typeDef, typeName) => {
      if (this.error) return false
      this._buildType(typeName, typeDef)
    })

    return this
  }

  /**
   * Creates schemas
   * @private
   */
  _makeSchemas (schemas) {
    _.forEach(schemas, (def, name) => {
      this.schemas[name] = Schema.call(this, def, name)
    })

    return this
  }

  /**
   * Builds a Type using the appropriate builder
   * @param typeName
   * @private
   */
  _buildType (typeName, typeDef) {
    if (this.error) return

    if (!typeDef) {
      this.error = new Error('GraphQLFactoryGenerateError: '
        + 'No definition for type "' + typeName + '"')
      return
    }

    // get the actual graphql type
    const { type } = typeDef

    // build the appropriate type
    switch (type) {
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
        break
    }
  }

  /**
   * Binds context and middleware to a field resolve
   * @param fn
   * @param def
   */
  bindResolve (fn, fieldDef) {
    if (!fn) return

    const resolve = _.isString(fn)
      ? _.get(this.functions, `["${fn}"]`)
      : fn
    const ctx = _.assign({}, this._context, { fieldDef })

    if (!_.isFunction(resolve)) {
      this.error = new Error('GraphQLFactoryGenerateError: No resolve found')
      return
    }

    // return the middleware resolvers
    return function (source, args, context, info) {
      // create a request object
      const req = {
        source,
        args,
        context: _.assign(ctx, context),
        info,
        reroutes: 0
      }

      // call the middleware
      return middleware(this, resolve, req)
    }
  }

  /**
   * Binds context to a function
   * @param fn
   * @param def
   */
  bindFunction (fn, fieldDef) {
    if (!fn) return

    const func = _.isString(fn)
      ? _.get(this.functions, `["${fn}"]`)
      : fn
    const ctx = _.assign({}, this._context, { fieldDef })

    if (!_.isFunction(func)) {
      this.error = new Error('GraphQLFactoryGenerateError: No function found')
      return
    }

    // return the wrapped function and call with apply
    // because arguments may vary
    return function () {
      return func.apply(ctx, [ ...arguments ])
    }
  }

  /**
   * Makes a new type from a field def
   * @param field
   */
  makeType (field) {
    const { type } = field
    return toObjectType(this.graphql, type, name => {
      const gqlType = _.get(
        this.types,
        `["${name}"]`,
        _.get(this._scalars, `["${name}"]`)
      )

      if (!gqlType) {
        this.error = new Error('GraphQLFactoryGenerateError: '
          + 'Cannot make type "' + name + '"')
      }
      return gqlType
    })
  }

  /**
   * Generates types and schemas
   * @param definition
   */
  generate (definition, options) {
    const { _types, _schemas, _functions } = definition
    this._id = _.get(options, 'id', this._id)
    this._def = definition
    this.functions = _functions

    // resolve types then schemas
    this
      ._makeContext(definition)
      ._makeTypes(_types)
      ._makeSchemas(_schemas)

    if (this.error) throw this.error
    return this
  }
}
