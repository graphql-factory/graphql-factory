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

  //  create a GraphQLFieldConfigMapThunk
  let createGraphQLFieldConfigMapThunk = function (typeDef) {
    return _.mapValues(typeDef, function (field) {
      return { type: types.getType(field) }
    })
  }

  //  create a GraphQLInterfacesThunk
  let createGraphQLInterfacesThunk = function (interfaces) {
    let thunk = _.without(_.map(interfaces, function (type) {
      let i = types.getType(type)
      if (i instanceof gql.GraphQLInterfaceType) return i
      else return null
    }), null)
    return (thunk.length > 0) ? thunk : undefined
  }

  //  create a GraphQLTypeThunk - not officially documented
  let createGraphQLTypeThunk = function (types) {
    let thunk = _.without(_.map(types, function (t) {
      return types.getType(t)
    }), undefined)
    return (thunk.length > 0) ? thunk : undefined
  }

  //  create a GraphQLObjectType
  let createGraphQLObjectType = function (typeDef, typeName) {
    return new gql.GraphQLObjectType({
      name: typeDef.$$name || typeName,
      interfaces: () => createGraphQLInterfacesThunk(typeDef.$$interfaces),
      fields: () =>  createGraphQLFieldConfigMapThunk(omitOptions(typeDef)),
      isTypeOf: _.isFunction(typeDef.$$isTypeOf) ? typeDef.$$isTypeOf : undefined,
      description: typeDef.$$description
    })
  }

  //  create a GraphQLInterfaceType
  let createGraphQLInterfaceType = function (typeDef, typeName) {
    return new gql.GraphQLInterfaceType({
      name: typeDef.$$name || typeName,
      fields: () =>  createGraphQLFieldConfigMapThunk(omitOptions(typeDef)),
      resolveType: typeDef.$$resolveType,
      description: typeDef.$$description
    })
  }

  //  create a GraphQLEnumType
  let createGraphQLEnumType = function (typeDef, typeName) {
    return new gql.GraphQLEnumType({
      name: typeDef.$$name || typeName,
      values: _.mapValues(omitOptions(typeDef), function (v) {
        return { value: v }
      })
    })
  }
  
  //  create a GraphQLInputObjectType
  let createGraphQLInputObjectType = function (typeDef, typeName) {
    return new gql.GraphQLInputObjectType({
      name: typeDef.$$name || typeName,
      fields: () => _.mapValues(omitOptions(typeDef), function (field, fieldName) {
        return {
          name: field.name || fieldName,
          type: types.getType(field),
          defaultValue: field.defaultValue,
          description: field.description
        }
      })
    })
  }

  //  create a GraphQLScalarType
  let createGraphQLScalarType = function (typeDef, typeName) {
    return new gql.GraphQLScalarType({
      name: typeDef.$$name || typeName,
      serialize: typeDef.serialize,
      parseValue: typeDef.parseValue,
      parseLiteral: typeDef.parseLiteral
    })
  }

  //  create a GraphQLUnionType
  let createGraphQLUnionType = function (typeDef, typeName) {
    return new gql.GraphQLUnionType({
      name: typeDef.$$name || typeName,
      types: () => createGraphQLTypeThunk(typeDef.$$types),
      resolveType: typeDef.$$resolveType,
      description: typeDef.$$description
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
        case 'Scalar':
          definitions.types[typeName] = createGraphQLScalarType(typeDef, typeName)
          break
        case 'Interface':
          definitions.types[typeName] = createGraphQLInterfaceType(typeDef, typeName)
          break
        case 'Union':
          definitions.types[typeName] = createGraphQLUnionType(typeDef, typeName)
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