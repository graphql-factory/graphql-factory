import _ from 'lodash'
import * as graphql from 'graphql'
import rethinkdbdash from 'rethinkdbdash'
let r = rethinkdbdash()
let factory = require('../index')(graphql)

/* make sure tables exist */
function createTable (db, name) {
  return r.db(db).tableCreate(name).run().then(function () {
    console.log('RETHINKDB: Created Table', name, 'on', db)
  }).catch(function (err) {
    console.log('RETHINKDB: Table', name, 'on', db, 'exists')
  })
}
let tables = {
  user: { db: 'test', table: 'user' }
}
_.forEach(tables, function (type) {
  if (type.db && type.table) createTable(type.db, type.table)
})


let schema = {
  types: {
    User: {
      id: { type: 'String', primary: true },
      firstName: { type: 'String' },
      lastName: { type: 'String' },
      email: { type: 'String', nullable: true }
    }
  },
  schemas: {
    Users: {
      query: {
        users: {
          type: ['User'],
          resolve: (root, args) => {
            return r.db(tables.user.db).table(tables.user.table).run()
          }
        }
      },
      mutation: {
        create: {
          type: 'User',
          args: {
            firstName: { type: 'String' },
            lastName: { type: 'String' },
            email: { type: 'String', nullable: true }
          },
          resolve: (obj, args, source, fieldASTs) => {
            return r.db(tables.user.db).table(tables.user.table)
              .insert({
                id: r.uuid(),
                firstName: args.firstName,
                lastName: args.lastName,
                email: args.email
              }, {
                returnChanges: true
              })
              .run()
              .then(function (result) {
                if (result.changes.length > 0) return result.changes[0].new_val
                return result
            })
          }
        }
      }
    }
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
          return r.db(tables.user.db).table(tables.user.table).run()
        }
      }
    }
  })
})

graphql.graphql(s, '{ users { id, firstName, lastName, email } }').then(function (result) {
  _.forEach(result.errors, function (e, i) {
    result.errors[i] = e.message
  })
  console.log(JSON.stringify(result, null, '  '))
})

// console.log(d.make(schema))