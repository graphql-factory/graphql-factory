import _ from '../utils/index'
import FactoryGQLEnumType from './FactoryGQLEnumType'
import FactoryGQLInputObjectType from './FactoryGQLInputObjectType'
import FactoryGQLInterfaceType from './FactoryGQLInterfaceType'
import FactoryGQLObjectType from './FactoryGQLObjectType'
import FactoryGQLScalarType from './FactoryGQLScalarType'
import FactoryGQLSchema from './FactoryGQLSchema'
import FactoryGQLUnionType from './FactoryGQLUnionType'
import {
  BOOLEAN,
  ENUM,
  FLOAT,
  ID,
  INPUT,
  INT,
  INTERFACE,
  OBJECT,
  SCALAR,
  STRING,
  UNION
} from './constants'

/*
 * Type generator class
 * NOTES:
 *   - Adding to base resolver context done in this.fnContext
 *   - Adding to individual field resolver context done in processMiddleware ctx variable
 */
export default class GraphQLFactoryTypeGenerator {
  constructor (graphql, definition, lib, factory) {
    this._generated = false
    this.graphql = graphql
    this.definition = definition
    this.factory = factory
    this._types = {}
    this._schemas = {}
    this.typeMap = {
      [BOOLEAN]: graphql.GraphQLBoolean,
      [FLOAT]: graphql.GraphQLFloat,
      [ID]: graphql.GraphQLID,
      [INT]: graphql.GraphQLInt,
      [STRING]: graphql.GraphQLString
    }

    // create a new function context
    this.fnContext = {
      lib,
      definition: definition.definition,
      globals: definition.plugin.globals,
      graphql,
      utils: _,
      types: this._types,
      schemas: this._schemas
    }

    _.forEach(definition.pluginRegistry, plugin => {
      if (plugin.context) this.fnContext = Object.assign(this.fnContext, plugin.context)
    })
  }


  /**
   * Processes middleware
   * @param resolver
   * @param args
   * @param fieldDef
   * @returns {Promise}
   */
  processMiddleware (resolver, args, fieldDef) {
    return new Promise((resolve, reject) => {
      const status = {
        resolved: false,
        rejected: false,
        isFulfilled: false
      }

      // create a new resolver context by merging the
      // type context with a new object and the fieldDef
      const ctx = Object.assign({}, this.fnContext, { fieldDef })

      // create a reject handler so that reject is only called once
      const doReject = error => {
        if (status.isFulfilled) return
        status.isFulfilled = true
        status.rejected = true
        reject(error)
      }

      // create a resolve handler so that resolve is only called once
      const doResolve = result => {
        if (status.isFulfilled) return
        status.isFulfilled = true
        status.resolved = true
        resolve(result)
      }

      // if there is no middleware proceed to the resolver
      if (!this.definition._middleware.before.length) {
        return this.processResolver(resolver, args, ctx, doResolve, doReject)
      }

      // add a timeout to the middleware
      const timeout = setTimeout(() => {
        this.processResolver(resolver, args, ctx, doResolve, doReject)
      }, this.definition._middleware.beforeTimeout)

      let hooks = this.definition._middleware.before.slice()
      const next = error => {
        hooks = hooks.splice(1)
        if (error) return reject(error)
        if (!hooks.length) {
          clearTimeout(timeout)
          return this.processResolver(resolver, args, ctx, doResolve, doReject)
        }
        return hooks[0].apply(ctx, [ args, next ])
      }
      return hooks[0].apply(ctx, [ args, next ])
    })
  }

  processResolver (resolver, args, ctx, resolve, reject) {
    return Promise.resolve(resolver.apply(ctx, _.values(args)))
      .then(result => {
        return this.afterMiddleware(result, args, ctx, resolve, reject)
      }, reject)
  }

  afterMiddleware (result, args, ctx, resolve, reject) {
    // if there is no middleware resolve the result
    if (!this.definition._middleware.after.length) return resolve(result)

    // add a timeout to the middleware
    const timeout = setTimeout(() => {
      resolve(result)
    }, this.definition._middleware.afterTimeout)

    let hooks = this.definition._middleware.after.slice()
    const next = (error, res) => {
      const nextResult = res === undefined
        ? result
        : res
      hooks = hooks.splice(1)
      if (error) return reject(error)
      if (!hooks.length) {
        clearTimeout(timeout)
        return resolve(nextResult)
      }
      return hooks[0].apply(ctx, [ args, nextResult, next ])
    }
    return hooks[0].apply(ctx, [ args, result, next ])
  }

  bindFunction (fn, fieldDef, ignoreMiddleware) {
    if (!fn) return
    const resolver = _.isFunction(fn)
      ? fn
      : this.definition.get(`functions["${fn}"]`)
    if (!_.isFunction(resolver)) {
      this.factory.emit('log', {
        source: 'typeGenerator',
        level: 'error',
        error: new Error(`TypeGeneratorError: Could not find resolver function "${fn}"`)
      })
    }
    return (source, args, context, info) => {
      return ignoreMiddleware === true
        ? resolver.call(
          Object.assign({}, this.fnContext, { fieldDef }), source, args, context, info
        )
        : this.processMiddleware(resolver, { source, args, context, info }, fieldDef)
    }
  }

  makeFieldType (field) {
    const { type, nullable, primary } = field
    const isList = _.isArray(type) && type.length > 0
    const nonNull = nullable === false || primary === true
    const typeName = isList
      ? type[0]
      : type
    let typeObj = null

    if (_.has(this.types, `["${typeName}"]`)) {
      typeObj = this.types[typeName]
    } else if (_.has(this.typeMap, `["${typeName}"]`)) {
      typeObj = this.typeMap[typeName]
    } else if (this.definition.hasExtType(typeName)) {
      typeObj = this.definition.getExtType(typeName)
    } else if (_.has(this.graphql, `["${typeName}"]`)) {
      typeObj = this.graphql[typeName]
    } else {
      const err = new Error(`TypeGeneratorError: Invalid type "${typeName}"`)
      this.factory.emit('log', {
        source: 'typeGenerator',
        level: 'error',
        error: err
      })
      throw err
    }

    const gqlType = isList
      ? new this.graphql.GraphQLList(typeObj)
      : typeObj

    return nonNull
      ? new this.graphql.GraphQLNonNull(gqlType)
      : gqlType
  }

  resolveType (field, rootType) {
    const f = _.isString(field) || _.isArray(field)
      ? { type: field }
      : field
    const { type } = f

    if (!type && _.has(f, `["${rootType}"]`)) {
      return this.makeFieldType(_.merge({}, f, {
        type: f[rootType]
      }))
    }

    return this.makeFieldType(f)
  }

  makeSchemas () {
    _.forEach(this.definition.schemas, (definition, nameDefault) => {
      const { name } = definition
      this._schemas[name || nameDefault] = FactoryGQLSchema(this, definition, nameDefault)
    })
    return this
  }

  makeType (typeToMake) {
    _.forEach(this.definition.types, (definition, nameDefault) => {
      const { name, type } = definition
      const useName = name || nameDefault
      if (type !== typeToMake) return

      switch (type) {
        case ENUM:
          this._types[useName] = FactoryGQLEnumType(this, definition, nameDefault)
          break
        case INPUT:
          this._types[useName] = FactoryGQLInputObjectType(this, definition, nameDefault)
          break
        case INTERFACE:
          this._types[useName] = FactoryGQLInterfaceType(this, definition, nameDefault)
          break
        case OBJECT:
          this._types[useName] = FactoryGQLObjectType(this, definition, nameDefault)
          break
        case SCALAR:
          this._types[useName] = FactoryGQLScalarType(this, definition, nameDefault)
          break
        case UNION:
          this._types[useName] = FactoryGQLUnionType(this, definition, nameDefault)
          break
        default:
          const err = new Error(`TypeGeneratorError: "${type}" is an invalid base type`)
          this.factory.emit('log', {
            source: 'typeGenerator',
            level: 'error',
            error: err
          })
          throw err
      }
    })
    return this
  }

  values () {
    return {
      types: this._types,
      schemas: this._schemas
    }
  }

  generate () {
    // generate should only be called once
    if (this._generated) return
    this._generated = true

    return this.makeType(ENUM)
      .makeType(SCALAR)
      .makeType(INPUT)
      .makeType(OBJECT)
      .makeType(INTERFACE)
      .makeType(UNION)
      .makeSchemas()
      .values()
  }

  get types () {
    if (_.keys(this._types).length) return this._types
    this.generate()
    return this._types
  }

  get schemas () {
    if (_.keys(this._schemas).length) return this._schemas
    this.generate()
    return this._schemas
  }
}
