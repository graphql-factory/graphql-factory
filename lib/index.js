import _ from 'lodash'

export default function (gql) {
  let definitions = { types: {}, schemas: {} }
  let customTypes = {}
  let types = require('./types')(gql, customTypes, definitions)

  //  register custom types
  let registerTypes = function (obj) {
    _.forEach(obj, function (type, name) {
      customTypes[name] = type
    })
  }

  //  omit options that start with a $$
  let omitOptions = function (def) {
    return _.omitBy(def, function (v,k) {
      return k.match(/^\$\$/)
    })
  }

  //  create a GraphQLObjectType
  let createGraphQLObjectType = function (typeDef, typeName) {
    return new gql.GraphQLObjectType({
      name: typeDef.$$name || typeName,
      description: typeDef.$$description || '',
      fields: () =>  _.mapValues(omitOptions(typeDef), function (field) {
        return { type: types.getType(field) }
      })
    })
  }

  //  create a GraphQLEnumType
  let createGraphQLEnumType = function (typeDef, typeName) {
    return new gql.GraphQLEnumType({
      name: typeDef.$$name || typeName,
      description: typeDef.$$description || '',
      values: _.mapValues(omitOptions(typeDef), function (v) {
        return { value: v }
      })
    })
  }
  
  //  create a GraphQLInputObjectType
  let createGraphQLInputObjectType = function (typeDef, typeName) {
    return new gql.GraphQLInputObjectType({
      name: typeDef.$$name || typeName,
      description: typeDef.$$description || '',
      fields: _.mapValues(omitOptions(typeDef), function (field) {
        return { type: types.getType(field) }
      })
    })
  }
  
  //  make all graphql objects
  let make = function (def) {

    let lib = {}

    //  build types first since schemas will use them
    _.forEach(def.types, function (typeDef, typeName) {
      //  handle different types, default to GraphQLObjectType
      switch (typeDef.$$type) {
        case 'Enum':
          definitions.types[typeName] = createGraphQLEnumType(typeDef, typeName)
          break
        case 'Input':
          definitions.types[typeName] = createGraphQLInputObjectType(typeDef, typeName)
          break
        default:
          definitions.types[typeName] = createGraphQLObjectType(typeDef, typeName)
      }
    })

    //  build schemas
    _.forEach(def.schemas, function (schemaDef, schemaName) {
      
      //  create an object to hold the schema
      let s = {}

      //  build schema query
      if (schemaDef.query) {
        s.query = new gql.GraphQLObjectType({
          name: schemaDef.query.$$name || 'Query',
          fields: _.mapValues(omitOptions(schemaDef.query), function (queryDef) {
            return {
              type: types.getType(queryDef.type),
              resolve: queryDef.resolve
            }
          })
        })
      }
      //  build schema mutations
      if (schemaDef.mutation) {
        s.mutation = new gql.GraphQLObjectType({
          name: schemaDef.mutation.$$name || 'Mutation',
          fields: _.mapValues(omitOptions(schemaDef.mutation), function (mutationDef) {
            return {
              type: types.getType(mutationDef.type),
              args: _.mapValues(mutationDef.args, function (field, fieldName) {
                return { name: fieldName, type: types.getType(field) }
              }),
              resolve: mutationDef.resolve
            }
          })
        })
      }

      //  create the schema and store it in the hash
      definitions.schemas[schemaName] = new gql.GraphQLSchema(s)

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