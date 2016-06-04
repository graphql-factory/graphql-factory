import * as graphql from 'graphql'
let factory = require('../index')(graphql)

let schema = {
    types: {
        User: {
            id: { type: 'String', primary: true },
            name: { type: graphql.GraphQLString },
            email: { type: 'String', nullable: true },
            friends: { type: ['User'] }
        }
    },
    schemas: {

    }
}

let defs = factory.make(schema)

let s = new graphql.GraphQLSchema({
    query: new graphql.GraphQLObjectType({
        name: 'UserQueryType',
        fields: {
            users: {
                type: new graphql.GraphQLList(defs.types.User),
                resolve: (root, args) => {
                    return [
                        {
                            id: '2133433', name: 'test', email: 'lkfsdjfsk',
                            friends: [ {id: '098293042', name: 'friend', email: 'xyz' } ]
                        }
                    ]
                }
            }
        }
    })
})

graphql.graphql(s, '{ users { id, name, email, friends { id } } }').then(function (result) {
    console.log(JSON.stringify(result, null, '  '))
})

// console.log(d.make(schema))