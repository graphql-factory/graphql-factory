import _ from 'lodash'

module.exports = function (gql) {
  let typeMap = {
    'String': gql.GraphQLString,
    'Int': gql.GraphQLInt,
    'Boolean': gql.GraphQLBoolean,
    'Float': gql.GraphQLFloat
  }

  let getType = function (field, schema) {
    let type = field
    let skipNull = false
    if (_.isObject(field) && !_.isArray(field)) {
      type = _.isArray(field.type) ? field.type[0] : field.type
      skipNull = true
    } else {
      type = _.isArray(field) ? field[0] : field
    }

    if (_.has(schema.types, type)) {
      type = schema.types[type]
    } else if (_.has(gql, type)) {
      type = type
    } else if (_.has(typeMap, type)) {
      type = typeMap[type]
    } else {
      console.log(type, field, schema.types)
    }

    type = _.isArray(field.type) ? new gql.GraphQLList(type) : type
    type = !skipNull && (!field.nullable || field.primary) ? new gql.GraphQLNonNull(type) : type
    return type
  }

  return { getType }
}