import _ from 'lodash'

export default function (gql) {
  let schema = {
    types: {},
    schemas: {}
  }
  let types = require('./types')(gql)
  let make = function (def) {

    //  build types first
    _.forEach(def.types, function (typeDef, typeName) {
      schema.types[typeName] = new gql.GraphQLObjectType({
        name: typeName,
        fields: () =>  _.mapValues(typeDef, function (field) {
          return { type: types.getType(field, schema) }
        })
      })
    })

    //  build schemas
    _.forEach(def.schemas, function (schemaDef, schemaName) {
      let s = { query: {}, mutation: {} }

      //  build schema query
      if (schemaDef.query) s.query = { name: 'Query', fields: {} }
      _.forEach(schemaDef.query, function (queryDef, queryName) {
        s.query.fields[queryName] = {
          type: types.getType(queryDef.type, schema),
          resolve: queryDef.resolve
        }
      })
      s.query = _.isEmpty(s.query) ? null : new gql.GraphQLObjectType(s.query)

      //  build schema mutations
      if (schemaDef.mutation) s.mutation = { name: 'Mutation', fields: {} }
      _.forEach(schemaDef.mutation, function (mutationDef, mutationName) {
        s.mutation.fields[mutationName] = {
          type: types.getType(mutationDef.type, schema),
          args: _.mapValues(mutationDef.args, function (field, fieldName) {
            return { name: fieldName, type: types.getType(field, schema) }
          }),
          resolve: mutationDef.resolve
        }
      })
      s.mutation = _.isEmpty(s.mutation) ? null : new gql.GraphQLObjectType(s.mutation)

      //  create the schema and store it in the hash
      schema.schemas[schemaName] = new gql.GraphQLSchema(_.pickBy(s, null))
    })

    return schema
  }

  return {
    make
  }
}