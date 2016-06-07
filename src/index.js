import _ from 'lodash'
import Types from './types'

module.exports = function (gql) {
  let definitions = { types: {}, schemas: {} }
  let customTypes = {}
  let t = Types(gql, customTypes, definitions)

  //  register custom types
  let registerTypes = function (obj) {
    _.forEach(obj, function (type, name) {
      customTypes[name] = type
    })
  }

  //  make all graphql objects
  let make = function (def) {

    let lib = {}

    //  build types first since schemas will use them
    _.forEach(def.types, function (typeDef, typeName) {
      switch (typeDef.type) {
        case 'Enum':
          definitions.types[typeName] = t.GraphQLEnumType(typeDef, typeName)
          break
        case 'Input':
          definitions.types[typeName] = t.GraphQLInputObjectType(typeDef, typeName)
          break
        case 'Scalar':
          definitions.types[typeName] = t.GraphQLScalarType(typeDef, typeName)
          break
        case 'Interface':
          definitions.types[typeName] = t.GraphQLInterfaceType(typeDef, typeName)
          break
        case 'Union':
          definitions.types[typeName] = t.GraphQLUnionType(typeDef, typeName)
          break
        case 'Object':
          definitions.types[typeName] = t.GraphQLObjectType(typeDef, typeName)
          break
        default:
          definitions.types[typeName] = t.GraphQLObjectType(typeDef, typeName)
      }
    })

    //  build schemas
    _.forEach(def.schemas, function (schemaDef, schemaName) {
      //  create a schema
      definitions.schemas[schemaName] = t.GraphQLSchema(schemaDef)

      //  create a function to execute the graphql schmea
      lib[schemaName] = function (query) {
        return gql.graphql(definitions.schemas[schemaName], query)
      }
    })
    lib._definitions = definitions
    return lib
  }
  return { make, registerTypes }
}