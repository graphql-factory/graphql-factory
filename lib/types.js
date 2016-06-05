import _ from 'lodash'

module.exports = function (gql, customTypes, definitions) {

  //  primitive types
  let typeMap = {
    'String': gql.GraphQLString,
    'Int': gql.GraphQLInt,
    'Boolean': gql.GraphQLBoolean,
    'Float': gql.GraphQLFloat
  }

  //  resolves the type from the schema, custom types, and graphql itself
  let getType = function (field) {
    let isObject = _.has(field, 'type')
    let type = isObject ? field.type : field
    let isArray = _.isArray(type)
    type = isArray ? type[0] : type

    if (_.has(definitions.types, type)) {
      type = definitions.types[type]
    } else if (_.has(typeMap, type)) {
      type = typeMap[type]
    } else if (_.has(customTypes, type)) {
      type = customTypes[type]
    } else if (_.has(gql, type)) {
      console.log('unknown type', type)
    }

    //  type modifiers for list and non-null
    type = isArray ? new gql.GraphQLList(type) : type
    type = (isObject && (!field.nullable || field.primary)) ? new gql.GraphQLNonNull(type) : type
    return type
  }

  return { getType }
}