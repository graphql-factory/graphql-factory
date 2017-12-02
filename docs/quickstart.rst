Quickstart
==========

Install `graphql-factory <https://github.com/graphql-factory/graphql-factory>`_ and
`graphql <https://github.com/graphql/graphql-js>`_ in your project ::

    npm install --save graphql graphql-factory

Import `graphql-factory <https://github.com/graphql-factory/graphql-factory>`_ and
`graphql <https://github.com/graphql/graphql-js>`_, then create a new factory ::

    import * as graphql from 'graphql'
    import GraphQLFactory from 'graphql-factory'

    const factory = GraphQLFactory(graphql)

Create a factory definition ::

    const definition = {
        types: {
            User: {
                name: 'User',
                fields: {
                    id: { type: 'ID', nullable: false },
                    name: { type: 'String', nullable: false },
                    email: { type: 'String' }
                }
            },
            UsersQuery: {
                listUsers: {
                    type: ['User'],
                    args: {
                        search: { type: 'String' }
                    },
                    resolve (source, args, context, info) {
                        return context.db
                            .table('user')
                            .filter(args)
                    }
                }
            }
        },
        schemas: {
            Users: {
                query: 'UsersQuery'
            }
        }
    }

Make a library object from the definition ::

    const lib = factory.make(definition)

Make a request ::

    lib.Users(`
        query Query ($search: String) {
            listUsers (search: $search) {
                id
                name
                email
            }
        }
    `, {}, { db }, {
        search: 'john'
    })
    .then(users => {
        // process results
    })

