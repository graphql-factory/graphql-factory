import Types from './types'
import compile from './compile'
import * as utils from './utils'
let _ = utils

let factory = function (gql) {
  let plugins = {}
  let definitions = {
    globals: {},
    fields: {},
    functions: {},
    externalTypes: {},
    types: {},
    schemas: {}
  }
  let t = Types(gql, definitions)
  let typeFnMap = t.typeFnMap

  //  check for valid types
  let validateType = function (type) {
    if (!_.has(typeFnMap, type)) {
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
    _.forEach(type, (tName, tType) => {
      validateType(tType)
      _types[tType] = makeTypeName(tType, typeDef, typeName, tName)
    })
  }

  //  add plugin
  let plugin = function (p) {
    if (!p) return
    p = _.isArray(p) ? p : [p]
    _.forEach(p, (h) => {
      plugins = _.merge(plugins, _.omit(h, 'externalTypes'));
      plugins.externalTypes = Object.assign(plugins.externalTypes || {}, h.externalTypes)
    })
  }

  //  make all graphql objects
  let make = function (def = {}, opts = {}) {
    let lib = {}

    // allow plugins to be added with a make option
    plugin(opts.plugin)

    // now merge all plugins into the def
    _.merge(def, _.omit(plugins, 'externalTypes'));
    def.externalTypes = Object.assign(def.externalTypes || {}, plugins.externalTypes || {})

    // compile the def if no option to suppress
    if (opts.compile !== false) _.merge(def, compile(def))

    // ensure globals and fields have objects
    def.globals = def.globals || {}
    def.fields = def.fields || {}

    //  merge the externalTypes and functions before make
    Object.assign(definitions.externalTypes, def.externalTypes || {})
    Object.assign(definitions.functions, def.functions || {})
    
    //  add the globals, utils, and graphql reference
    definitions.globals = def.globals
    definitions.utils = utils
    definitions.graphql = gql

    // before building types, clone the compiled schemaDef
    // and store it in the definition
    definitions.definition = _.clone(_.omit(def, 'globals'))

    let nonUnionDefs = _.omitBy(def.types, (tDef) => {
      return tDef.type === 'Union'
    })
    let unionDefs = _.pickBy(def.types, (tDef) => {
      return tDef.type === 'Union'
    })

    //  build types first since schemas will use them, save UnionTypes for the end
    _.forEach(nonUnionDefs, (typeDef, typeName) => {

      let _types = {}

      //  default to object type
      if (!typeDef.type) typeDef.type = 'Object'

      //  if a single type is defined as a string
      if (_.isString(typeDef.type)) {

        //  validate the type and add it
        validateType(typeDef.type)
        _types[typeDef.type] = typeDef.name || typeName

      } else if (_.isArray(typeDef.type)) {

        //  look at each type in the type definition array
        //  support the case [ String, { Type: Name } ] with defaults
        _.forEach(typeDef.type, (t) => {
          if (_.isString(t)) {
            validateType(t)
            _types[t] = makeTypeName(t, typeDef, typeName)
          } else if (_.isHash(t)) {
            addTypeHash(_types, t, typeDef, typeName)
          }
        })
      } else if (_.isHash(typeDef.type)) {
        addTypeHash(_types, typeDef.type, typeDef, typeName)
      }

      //  add the definitions
      _.forEach(_types, (tName, tType) => {
        definitions.types[tName] = typeFnMap[tType](typeDef, tName)
      })
    })

    //  add union definitions
    _.forEach(unionDefs, (unionDef, unionName) => {
      definitions.types[unionName] = t.GraphQLUnionType(unionDef, unionName)
    })

    //  build schemas
    _.forEach(def.schemas, (schemaDef, schemaName) => {
      //  create a schema
      try {
        definitions.schemas[schemaName] = t.GraphQLSchema(schemaDef, schemaName)

        //  create a function to execute the graphql schmea
        lib[schemaName] = function (query, rootValue, ctxValue, varValues, opName) {
          return gql.graphql(definitions.schemas[schemaName], query, rootValue, ctxValue, varValues, opName)
        }
      } catch (err) {
        console.log(err)
        return false
      }
    })

    lib._definitions = definitions

    return lib
  }
  return { make, plugin, utils, compile }
}

factory.utils = utils
export default factory