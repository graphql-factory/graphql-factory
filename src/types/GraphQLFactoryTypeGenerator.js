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
  constructor (graphql, definition) {
    this.graphql = graphql
    this.definition = definition
    this._types = null
    this._schemas = null
    this.fnContext = definition.plugin
    this.typeMap = {
      [BOOLEAN]: graphql.GraphQLBoolean,
      [FLOAT]: graphql.GraphQLFloat,
      [ID]: graphql.GraphQLID,
      [INT]: graphql.GraphQLInt,
      [STRING]: graphql.GraphQLString
    }
  }

  /****************************************************************************
   * Helpers
   ****************************************************************************/
  bindFunction (fn) {
    if (!fn) return
    let resolver = _.isFunction(fn) ? fn : this.definition.get(`functions["${fn}"]`)
    if (!_.isFunction(resolver)) console.error(`could not resolve function ${fn}`)
    return resolver.bind(this.fnContext)
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
    if (this._types !== null) return this._types
    this._types = {}
    this.makeNonUnionTypes()
    this.makeUnionTypes()
    return this._types
  }

  get schemas () {
    if (this._schemas !== null) return this._schemas
    this._schemas = {}
    this.makeSchemas()
    return this._schemas
  }
}