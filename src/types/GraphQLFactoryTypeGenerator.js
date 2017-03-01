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
 */
export default class GraphQLFactoryTypeGenerator {
  constructor (graphql, definition, lib) {
    this.graphql = graphql
    this.definition = definition
    this._types = {}
    this._schemas = {}
    this.typeMap = {
      [BOOLEAN]: graphql.GraphQLBoolean,
      [FLOAT]: graphql.GraphQLFloat,
      [ID]: graphql.GraphQLID,
      [INT]: graphql.GraphQLInt,
      [STRING]: graphql.GraphQLString
    }

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

  /****************************************************************************
   * Helpers
   ****************************************************************************/
  processMiddleware (resolver, args) {
    return new Promise((resolve, reject) => {
      let status = { resolved: false, rejected: false, isFulfilled: false }

      // create a reject handler so that reject is only called once
      let doReject = error => {
        if (status.isFulfilled) return
        status.isFulfilled = true
        status.rejected = true
        reject(error)
      }

      // create a resolve handler so that resolve is only called once
      let doResolve = result => {
        if (status.isFulfilled) return
        status.isFulfilled = true
        status.resolved = true
        resolve(result)
      }

      // if there is no middleware proceed to the resolver
      if (!this.definition._middleware.before.length) return this.processResolver(resolver, args, doResolve, doReject)

      // add a timeout to the middleware
      let timeout = setTimeout(() => {
        this.processResolver(resolver, args, doResolve, doReject)
      }, this.definition._middleware.beforeTimeout)

      let hooks = this.definition._middleware.before.slice()
      let next = error => {
        hooks = hooks.splice(1)
        if (error) return reject(error)
        if (!hooks.length) {
          clearTimeout(timeout)
          return this.processResolver(resolver, args, doResolve, doReject)
        }
        return hooks[0].apply(this.fnContext, [args, next])
      }
      return hooks[0].apply(this.fnContext, [args, next])
    })
  }

  processResolver (resolver, args, resolve, reject) {
    return Promise.resolve(resolver.apply(this.fnContext, _.values(args)))
      .then(result => {
        return this.afterMiddleware(result, args, resolve, reject)
      }, reject)
  }

  afterMiddleware (result, args, resolve, reject) {
    // if there is no middleware resolve the result
    if (!this.definition._middleware.after.length) return resolve(result)

    // add a timeout to the middleware
    let timeout = setTimeout(() => {
      resolve(result)
    }, this.definition._middleware.afterTimeout)

    let hooks = this.definition._middleware.after.slice()
    let next = (error, res) => {
      res = res === undefined ? result : res // default to original result if not supplied
      hooks = hooks.splice(1)
      if (error) return reject(error)
      if (!hooks.length) {
        clearTimeout(timeout)
        return resolve(res)
      }
      return hooks[0].apply(this.fnContext, [args, res, next])
    }
    return hooks[0].apply(this.fnContext, [args, result, next])
  }

  bindFunction (fn) {
    if (!fn) return
    let resolver = _.isFunction(fn) ? fn : this.definition.get(`functions["${fn}"]`)
    if (!_.isFunction(resolver)) console.error(`could not resolve function ${fn}`)
    return (source, args, context, info) => {
      return this.processMiddleware(resolver, { source, args, context, info })
    }
  }

  makeFieldType (field) {
    let { type, nullable, primary } = field
    let isList = _.isArray(type) && type.length > 0
    let nonNull = nullable === false || primary === true
    let typeName = isList ? type[0] : type
    let typeObj = null

    if (_.has(this.types, `["${typeName}"]`)) typeObj = this.types[typeName]
    else if (_.has(this.typeMap, `["${typeName}"]`)) typeObj = this.typeMap[typeName]
    else if (this.definition.hasExtType(typeName)) typeObj = this.definition.getExtType(typeName)
    else if (_.has(this.graphql, `["${typeName}"]`)) typeObj = this.graphql[typeName]
    else throw new Error(`invalid type ${typeName}`)

    let gqlType = isList ? new this.graphql.GraphQLList(typeObj) : typeObj
    return nonNull ? new this.graphql.GraphQLNonNull(gqlType) : gqlType
  }

  resolveType (field, rootType) {
    field = _.isString(field) || _.isArray(field) ? { type: field } : field
    let { type } = field

    if (!type && _.has(field, `["${rootType}"]`)) {
      return this.makeFieldType(_.merge({}, field, {
        type: field[rootType]
      }))
    }

    return this.makeFieldType(field)
  }

  makeNonUnionTypes () {
    _.forEach(this.definition.types, (definition, nameDefault) => {
      let { name, type } = definition
      let fn = null
      if (type === UNION) return

      switch (type) {
        case ENUM:
          fn = FactoryGQLEnumType
          break
        case INPUT:
          fn = FactoryGQLInputObjectType
          break
        case INTERFACE:
          fn = FactoryGQLInterfaceType
          break
        case OBJECT:
          fn = FactoryGQLObjectType
          break
        case SCALAR:
          fn = FactoryGQLScalarType
          break
        default:
          throw new Error(`${type} is an invalid base type`)
      }
      this._types[name || nameDefault] = fn(this, definition, nameDefault)
    })
  }

  makeUnionTypes () {
    _.forEach(this.definition.types, (definition, nameDefault) => {
      let { name, type } = definition
      if (type !== UNION) return
      this._types[name || nameDefault] = FactoryGQLUnionType(this, definition, nameDefault)
    })
  }

  makeSchemas () {
    _.forEach(this.definition.schemas, (definition, nameDefault) => {
      let { name } = definition
      this._schemas[name || nameDefault] = FactoryGQLSchema(this, definition, nameDefault)
    })
  }

  /****************************************************************************
   * Getters
   ****************************************************************************/
  get types () {
    if (_.keys(this._types).length) return this._types
    this.makeNonUnionTypes()
    this.makeUnionTypes()
    return this._types
  }

  get schemas () {
    if (_.keys(this._schemas).length) return this._schemas
    this.makeSchemas()
    return this._schemas
  }
}