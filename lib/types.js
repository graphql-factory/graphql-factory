import _ from 'lodash'

module.exports = function (gql) {

    let typeMap = {
        'String': gql.GraphQLString,
        'Int': gql.GraphQLInt,
        'Boolean': gql.GraphQLBoolean,
        'Float': gql.GraphQLFloat
    }

    let getType = function (type, schema) {
        type = _.isArray(type) ? type[0] : type

        if (_.has(schema.types, type)) {
            return schema.types[type]
        } else if (_.has(gql, type)) {
            return type
        } else if (_.has(typeMap, type)) {
            return typeMap[type]
        }
        
    }

    return {
        getType
    }
}