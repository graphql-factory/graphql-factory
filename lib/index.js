import _ from 'lodash'

export default function (gql) {
    let schema = {
        types: {}
    }
    let types = require('./types')(gql)
    let make = function (def) {
        //  build types first
        _.forEach(def.types, function (typeSchema, typeName) {
            schema.types[typeName] = new gql.GraphQLObjectType({
                name: typeName,
                fields: () =>  _.mapValues(typeSchema, function (field) {
                    let t = types.getType(field.type, schema)
                    t = _.isArray(field.type) ? new gql.GraphQLList(t) : t
                    t = (!field.nullable || field.primary) ? new gql.GraphQLNonNull(t) : t
                    return { type: t }
                })
            })
        })
        return schema
    }
    
    return {
        make
    }
}