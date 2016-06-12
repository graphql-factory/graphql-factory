import Types from './types'
import * as utils from './utils'
import {
  forEach as _forEach,
  isArray as _isArray,
  isHash as _isHash,
  isString as _isString,
  has as _has,
  omitBy as _omitBy,
  pickBy as _pickBy
} from './utils'

let factory = function (gql) {
  let definitions = { types: {}, schemas: {} }
  let customTypes = {}
  let t = Types(gql, customTypes, definitions)
  let typeFnMap = t.typeFnMap

  //  register custom types
  let registerTypes = function (obj) {
    _forEach(obj, function (type, name) {
      customTypes[name] = type
    })
  }

  //  check for valid types
  let validateType = function (type) {
    if (!_has(typeFnMap, type)) {
      throw `InvalidTypeError: "${type}" is not a valid object type in the current context`
    }
  }

  //  construct a type name
  let makeTypeName = function (t, typeDef, typeName, nameOverride) {
    if (t == 'Object') return nameOverride || typeDef.name || typeName
    else return nameOverride || (typeDef.name || typeName).concat(t)
  }

  //  add a hash type
  let addTypeHash = function (_types, type, typeDef, typeName) {
    _forEach(type, function (tName, tType) {
      validateType(tType)
      _types[tType] = makeTypeName(tType, typeDef, typeName, tName)
    })
  }

  //  make all graphql objects
  let make = function (def) {

    let lib = {}
    def.globals = def.globals || {}
    def.fields = def.fields || {}

    //  add the globals and definition to the output
    definitions.globals = def.globals
    definitions.utils = utils
    definitions.definition = _omitBy(def, function (v, k) {
      return k === 'globals'
    })

    let nonUnionDefs = _omitBy(def.types, function (tDef) {
      return tDef.type === 'Union'
    })
    let unionDefs = _pickBy(def.types, function (tDef) {
      return tDef.type === 'Union'
    })

    //  build types first since schemas will use them, save UnionTypes for the end
    _forEach(nonUnionDefs, function (typeDef, typeName) {

      let _types = {}

      //  default to object type
      if (!typeDef.type) typeDef.type = 'Object'

      //  if a single type is defined as a string
      if (_isString(typeDef.type)) {

        //  validate the type and add it
        validateType(typeDef.type)
        _types[typeDef.type] = typeDef.name || typeName

      } else if (_isArray(typeDef.type)) {

        //  look at each type in the type definition array
        //  support the case [ String, { Type: Name } ] with defaults
        _forEach(typeDef.type, function (t) {
          if (_isString(t)) {
            validateType(t)
            _types[t] = makeTypeName(t, typeDef, typeName)
          } else if (_isHash(t)) {
            addTypeHash(_types, t, typeDef, typeName)
          }
        })
      } else if (_isHash(typeDef.type)) {
        addTypeHash(_types, typeDef.type, typeDef, typeName)
      }

      //  add the definitions
      _forEach(_types, function (tName, tType) {
        definitions.types[tName] = typeFnMap[tType](typeDef, tName)
      })
    })

    //  add union definitions
    _forEach(unionDefs, function (unionDef, unionName) {
      definitions.types[unionName] = t.GraphQLUnionType(unionDef, unionName)
    })

    //  build schemas
    _forEach(def.schemas, function (schemaDef, schemaName) {
      //  create a schema
      try {
        definitions.schemas[schemaName] = t.GraphQLSchema(schemaDef)

        //  create a function to execute the graphql schmea
        lib[schemaName] = function (query) {
          return gql.graphql(definitions.schemas[schemaName], query)
        }
      } catch (err) {
        console.log(err)
        return false
      }
    })

    lib._definitions = definitions
    return lib
  }
  return { make, registerTypes, utils }
}

factory.utils = utils
export default factory