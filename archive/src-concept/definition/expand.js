import _ from '../common/lodash.custom'
import EventEmitter from 'events'
import Decomposer from './decompose'
import {
  assertField,
  constructorName,
  toTypeString,
  getBaseType,
  valueString,
} from '../common/util'
import {
  DECOMPOSABLE,
  OBJECT,
  INPUT,
  INTERFACE,
  UNION,
  ENUM,
  SCALAR,
  OUTPUT_TYPES,
  SCALAR_NAMES
} from '../common/const'

const NON_SCHEMA = _.without(DECOMPOSABLE, 'GraphQLSchema')
const NON_TYPE = _.without(DECOMPOSABLE, 'GraphQLObjectType')

export default class GraphQLFactoryDefinitionExpander extends EventEmitter {
  constructor () {
    super()
    this.definition = {}
    this.error = null
  }

  /**
   * Expands the definition
   * @param definition
   * @returns {*}
   */
  expand (definition) {
    // keep the original definition
    this._def = definition

    // build a new definition
    this.definition = {}

    // expand the definition
    this
      ._expandTypes()
      ._expandSchemas()

    // if an error was incountered throw it
    // otherwise return the expanded definition
    if (this.error) throw this.error
    return this.definition
  }

  /**
   * Merges a definition into the working definition
   * @param definition
   */
  merge (definition) {
    // skip processing if there are already errors
    if (this.error) return
    _.forEach(definition, (value, key) => {
      _.forEach(value, (def, name) => {
        const path = `["${key}"]["${name}"]`
        const defValue = _.get(this.definition, path)
        if (defValue) {
          if (!_.isEqual(defValue, def)) {
            this.emit('warn', {
              source: 'expand',
              message: key + ' ' + name + ' is already defined'
            })
          }
          // remove duplicates
          _.unset(definition, path)
        }
      })
    })
    _.merge(this.definition, definition)
  }

  /**
   * Expands a fields definition
   * @param fields
   * @returns {*}
   * @private
   */
  _expandFields (fields) {
    if (this.error) return
    return _.mapValues(fields, (field, fieldName) => {
      if (this.error) return
      const fieldStruct = constructorName(field)

      // check the type configuration
      if (valueString(field)) {
        return {
          type: field
        }
      } else if (_.includes(OUTPUT_TYPES, fieldStruct)) {
        const baseType = getBaseType(field)

        // attempt to decompose
        if (_.includes(DECOMPOSABLE, constructorName(baseType))
          && !_.includes(SCALAR_NAMES, baseType.name)) {
          this.merge(new Decomposer().decompose(baseType))
        }

        // return the type string
        return {
          type: toTypeString(field)
        }
      } else if (_.has(field, 'type')) {
        const { type, args } = field
        const structName = constructorName(type)

        // check for args and expand them using this function
        if (args && _.isObject(args) && _.keys(args).length) {
          field.args = this._expandFields(args)
        }

        if (valueString(type)) {
          return field
        } else if (_.includes(OUTPUT_TYPES, structName)) {
          const baseType = getBaseType(type)

          // attempt to decompose
          if (_.includes(DECOMPOSABLE, constructorName(baseType))
            && !_.includes(SCALAR_NAMES, baseType.name)) {
            this.merge(new Decomposer().decompose(baseType))
          }

          field.type = toTypeString(type)
          return field
        }
      }
      this.error = new Error('GraphQLFactoryExpandError: '
        + 'Failed to expand type definition for "' + fieldName + '" because '
        + 'it is improperly defined')
    })
  }

  /**
   * Expands enum values
   * @param values
   * @returns {*}
   * @private
   */
  _expandValues (values) {
    if (this.error) return {}
    return _.mapValues(values, (value, name) => {
      if (this.error) return
      if (valueString(value)) {
        return { value }
      } else if (!_.has(value, 'value')) {
        this.error = new Error('GraphQLFactoryExpandError: '
          + 'Enum definition for "' + name + '" is missing a value field')
      } else {
        return value
      }
    })
  }

  /**
   * Return a mapping of types
   * @param types
   * @returns {*}
   * @private
   */
  _mapTypes (types) {
    if (this.error) return []
    return _.map(types, t => {
      if (this.error) return
      if (valueString(t)) {
        return t
      } else if (constructorName(t) === 'GraphQLObjectType') {
        this.merge(new Decomposer().decompose(t))
        return t.name
      }

      this.error = new Error('GraphQLFactoryExpandError: '
        + 'types defintion should contain an array of '
        + 'strings or GraphQLObjectType')
    })
  }

  /**
   * Return a mapping of interfaces
   * @param interfaces
   * @returns {*}
   * @private
   */
  _mapInterfaces (interfaces) {
    if (this.error) return []
    return _.map(interfaces, i => {
      if (this.error) return
      if (valueString(i)) {
        return i
      } else if (constructorName(i) === 'GraphQLInterfaceType') {
        this.merge(new Decomposer().decompose(i))
        return i.name
      }

      this.error = new Error('GraphQLFactoryExpandError: '
        + 'interfaces defintion should contain an array of '
        + 'strings or GraphQLInterfaceType')
    })
  }

  /**
   * Expands a type definition
   * @param typeObj
   * @param typeName
   * @returns {*}
   * @private
   */
  _expandType (typeObj, typeName) {
    if (this.error) return

    const t = _.merge({}, typeObj)
    const {
      name,
      type,
      types,
      fields,
      values,
      serialize,
      interfaces
    } = typeObj

    // use the passed typeName over the internal name
    // this allows imported objects to be renamed
    const useName = typeName || name

    // do not allow un-named type definitions
    if (!valueString(useName)) {
      this.error = new Error('GraphQLFactoryExpandError: '
        + 'Un-named type definitions are not allowed')
      return
    }

    // do some required field assertions
    switch (type) {
      case undefined:
      case OBJECT:
      case INPUT:
      case INTERFACE:
        this.error = assertField('object', type, useName, fields, 'fields')
        if (this.error) return
        if (type === undefined) t.type = OBJECT
        t.fields = this._expandFields(fields)
        if (_.isArray(interfaces) && interfaces.length) {
          t.interfaces = this._mapInterfaces(interfaces)
        }
        break

      case SCALAR:
        this.error = assertField('function', type, useName, serialize, 'serialize')
        if (this.error) return
        break

      case UNION:
        this.error = assertField('array', type, useName, types, 'types')
        if (this.error) return
        t.types = this._mapTypes(types)
        break

      case ENUM:
        this.error = assertField('object', type, useName, values, 'values')
        if (this.error) return
        t.values = this._expandValues(values)
        break

      default:
        this.error = new Error('GraphQLFactoryExpandError: '
          + 'Unknown type "' + type + '"')
        return
    }

    return t
  }

  /**
   * Expands the types field of the definition
   * @returns {*}
   * @private
   */
  _expandTypes () {
    _.forEach(this._def.types, (type, typeName) => {
      const structName = constructorName(type)
      // if the type is a graphql object and not a schema
      // otherwise if the type def is not an object or is a schema set error
      if (_.includes(NON_SCHEMA, structName)) {
        this.merge(new Decomposer().decompose(type, typeName))
      } else if (!type
        || !_.isObject(type)
        || structName === 'GraphQLSchema') {
        this.error = this.error || new Error('GraphQLFactoryExpandError: '
          + 'Failed to expand type "' + typeName + '". Invalid value')
        return false
      } else {
        this.merge({
          types: {
            [typeName]: this._expandType(type, typeName)
          }
        })
      }
    })
    return this
  }

  /**
   * Expands schema objects
   * @private
   */
  _expandSchemas () {
    _.forEach(this._def.schemas, (schema, schemaName) => {
      if (this.error) return false
      const structName = constructorName(schema)

      if (_.has(this.definition.schemas, `["${schemaName}"]`)) {
        this.emit('warn', {
          source: 'expand',
          message: ' schema ' + schemaName + ' is already defined'
        })
      } else if (structName === 'GraphQLSchema') {
        this.merge(new Decomposer().decompose(schema, schemaName))
      } else if (!schema
        || !_.isObject(schema)
        || _.includes(NON_SCHEMA, structName)) {
        this.error = this.error || new Error('GraphQLFactoryExpandError: '
          + 'Failed to expand schema "' + schemaName + '". Invalid value')
        return false
      } else {
        _.forEach(schema, (opDef, opName) => {
          const opPath = `schemas["${schemaName}"]["${opName}"]`
          const opConstructor = constructorName(opDef)
          if (valueString(opDef)) {
            _.set(this.definition, opPath, opDef)
          } else if (opConstructor === 'GraphQLObjectType') {
            this.merge(new Decomposer().decompose(opDef))
            _.set(this.definition, opPath, opDef.name)
          } else if (!opDef
            || !_.isObject(opDef)
            || _.includes(NON_TYPE, opConstructor)) {
            this.error = new Error('GraphQLFactoryExpandError: '
              + 'Failed to expand schema "' + schemaName + '" ' + opName
              + '. Invalid value')
            return false
          } else if (!valueString(opDef.name)) {
            this.error = new Error('GraphQLFactoryExpandError: '
              + 'Failed to expand schema "' + schemaName + '" ' + opName
              + '. Missing name in object definition')
          } else {
            const typeDef = this._expandType(opDef)
            this.merge({
              types: {
                [typeDef.name]: typeDef
              }
            })
            _.set(this.definition, opPath, typeDef.name)
          }
        })
      }
    })
    return this
  }
}
