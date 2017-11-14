import _ from './utils/index'
import { TYPE_ALIAS } from './types/constants'

/**
 * Strips away nonnull and list objects to
 * build an info object containing the type
 * @param obj
 * @param info
 * @returns {*}
 */
function getTypeInfo (obj, info) {
  const constructorName = _.constructorName(obj)
  const _info = info || {
    type: null,
    name: null,
    isList: false,
    isNonNull: false
  }

  switch (constructorName) {
    case 'GraphQLNonNull':
      _info.isNonNull = true
      return getTypeInfo(obj.ofType, _info)
    case 'GraphQLList':
      _info.isList = true
      return getTypeInfo(obj.ofType, _info)
    default:
      _info.type = obj
      _info.name = obj.name
  }
  return _info
}

/**
 * creates a base def object
 * @param info
 * @returns {{type: [null]}}
 */
function baseDef (info) {
  const { name, isList, isNonNull } = info
  const def = {
    type: isList ? [ name ] : name
  }
  if (isNonNull) def.nullable = false
  return def
}

/**
 * Returns the return value of a thunk
 * or just the value if not a thunk
 * @param thunk
 * @returns {*}
 */
function resolveThunk (thunk) {
  return _.isFunction(thunk)
    ? thunk()
    : thunk
}

/**
 * Decomposes a graphql object into a graphql-factory definition
 */
export default class GraphQLFactoryDecomposer {
  constructor (type, name) {
    this.definition = {}

    if (!this._routeDecompose(type, name)) {
      throw new Error('Invalid GraphQL type passed for de-compose.')
    }

    return this.definition
  }

  /**
   * Decompose a GraphQLSchema
   * @param schema
   * @param schemaName
   * @constructor
   */
  GraphQLSchema (schema, schemaName = 'Root') {
    const opMap = {
      query: '_queryType',
      mutation: '_mutationType',
      subscription: '_subscriptionType'
    }

    // add the object type names to the operation
    _.forEach(opMap, (opField, opType) => {
      const opObj = _.get(schema, `["${opField}"]`)
      const opName = _.get(opObj, 'name')
      if (opName && _.isString(opName)) {
        _.set(
          this.definition,
          `schemas["${schemaName}"].${opType}`,
          opName
        )
        // decompose the operation object
        this.GraphQLObjectType(opObj, opName)
      }
    })
  }

  /**
   * Decompose a GraphQLEnumType
   * @param enumeration
   * @param enumName
   * @constructor
   */
  GraphQLEnumType (enumeration, enumName) {
    this._decomposeType(enumeration, enumName)
  }

  /**
   * Decompose a GraphQLInputObjectType
   * @param input
   * @param inputName
   * @constructor
   */
  GraphQLInputObjectType (input, inputName) {
    this._decomposeType(input, inputName)
  }

  /**
   * Decompose a GraphQLInterfaceType
   * @param iface
   * @param interfaceName
   * @constructor
   */
  GraphQLInterfaceType (iface, interfaceName) {
    this._decomposeType(iface, interfaceName)
  }

  /**
   * Decompose a GraphQLObjectType
   * @param object
   * @param objectName
   * @constructor
   */
  GraphQLObjectType (object, objectName) {
    this._decomposeType(object, objectName)
  }

  /**
   * Decompose a GraphQLScalarType
   * @param scalar
   * @param scalarName
   * @constructor
   */
  GraphQLScalarType (scalar, scalarName) {
    this._decomposeType(scalar, scalarName)
  }

  /**
   * Decompose a GraphQLUnionType
   * @param union
   * @param unionName
   * @constructor
   */
  GraphQLUnionType (union, unionName) {
    this._decomposeType(union, unionName)
  }

  /**
   * Routes a decompose to the appropriate type if it exists
   * and returns a boolean whether the type was found
   * @param type
   * @param name
   * @returns {boolean}
   * @private
   */
  _routeDecompose (type, name) {
    const typeName = _.constructorName(type)

    if (_.isFunction(this[typeName])) {
      this[typeName](type, name)
      return true
    }
    return false
  }

  /**
   * Generic type decompose
   * @param type
   * @param typeName
   * @private
   */
  _decomposeType (type, typeName) {
    const name = typeName || type.name
    if (_.get(this.definition, `types["${name}"]`)) return
    const constructorName = _.constructorName(type)
    const shortType = TYPE_ALIAS[constructorName]
    const config = type._typeConfig || type._enumConfig

    // if there is no config object, exit
    // otherwise create a placeholder for the type
    if (!config) return
    _.set(this.definition, `types["${name}"]`, {})

    // set the type value to the decomposed config
    _.set(
      this.definition,
      `types["${name}"]`,
      this._decomposeTypeConfig(config, shortType)
    )
  }

  /**
   * Decomposes typeConfig fields and args
   * @param fieldMap
   * @private
   */
  _decomposeFields (fieldMap) {
    return _.reduce(fieldMap, (fields, fieldDef, fieldName) => {
      fields[fieldName] = _.reduce(fieldDef, (config, value, key) => {
        switch (key) {
          case 'type':
            const info = getTypeInfo(value)
            this._routeDecompose(info.type)
            return Object.assign(config, baseDef(info))

          case 'args':
            config[key] = this._decomposeFields(value)
            break

          default:
            config[key] = value
            break
        }

        return config
      }, {})

      return fields
    }, {})
  }

  /**
   * Decomposes a type configuration into a graphql-factory definition
   * @param typeConfig
   * @returns {*}
   */
  _decomposeTypeConfig (typeConfig, type) {
    return _.reduce(typeConfig, (def, value, key) => {
      switch (key) {
        // used by various
        case 'fields':
          def.fields = this._decomposeFields(
            resolveThunk(value)
          )
          break

        // used by unions
        case 'types':
          const types = resolveThunk(value)
          if (_.isArray(types) && types.length) {
            def[key] = types.map(t => {
              this.GraphQLUnionType(t)
              return t.name
            })
          }
          break

        // used by object types
        case 'interfaces':
          const interfaces = resolveThunk(value)
          if (_.isArray(interfaces) && interfaces.length) {
            def[key] = interfaces.map(i => {
              this.GraphQLInterfaceType(i)
              return i.name
            })
          }
          break

        default:
          def[key] = value
          break
      }

      return def
    }, { type })
  }
}
