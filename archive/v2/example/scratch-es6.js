import _ from 'lodash'
import * as graphql from 'graphql'
import GraphQLFactory from '../../src-concept/index'
let factory = GraphQLFactory(graphql)


let db = {
  tables: {
    user: [
      {id: 1, name: 'User1', email: 'user1@domain.com' },
      {id: 2, name: 'User2', email: 'user2@domain.com' }
    ],
    group: [
      {id: 1, name: 'Group1', users: [1, 2] },
      {id: 2, name: 'Group2', users: [2] }
    ]
  }
}

let db2 = _.cloneDeep(db)

// def
let def = {
  functions: {
    resolveUser: function (source, args, context, info) {
      return db.tables.user
    },
    mutateUser: function (source, args, context, info) {
      var newUser = _.merge({ id: 3 }, args)
      db2.tables.user.push(newUser)
      return db2.tables.user[db2.tables.user.length - 1]
    },
    resolveGroups: function (source, args, context, info) {
      var result = []
      _.forEach(db.tables.group, function (group) {
        var groupObj = _.cloneDeep(group)
        var users = []
        _.forEach(groupObj.users, function (userId) {
          users.push(_.find(db.tables.user, {id: userId}))
        })
        groupObj.users = users
        result.push(groupObj)
      })
      return result
    }
  },
  fields: {
    Entity: {
      id: 'Int',
      name: 'String'
    }
  },
  types: {
    User: {
      extendFields: 'Entity',
      fields: {
        email: 'String'
      }
    },
    Group: {
      extendFields: 'Entity',
      fields: {
        users: ['User']
      }
    }
  },
  schemas: {
    UserSchema: {
      query: {
        fields: {
          getUsers: {
            type: ['User'],
            _typeName: 'User',
            resolve: 'resolveUser'
          }
        }
      },
      mutation: {
        fields: {
          addUser: {
            type: 'User',
            args: {
              name: 'String',
              email: 'String'
            },
            resolve: 'mutateUser'
          }
        }
      }
    },
    GroupSchema: {
      query: {
        fields: {
          getGroups: {
            type: ['Group'],
            resolve: 'resolveGroups'
          }
        }
      }
    }
  }
}

let lib = factory.make(def)

console.log(lib._definitions.types)