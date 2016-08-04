var _ = require('lodash')

describe('Query', function () {

  // mock db
  var db = {
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

  var db2 = _.cloneDeep(db)

  // def
  var def = {
    types: {
      User: {
        fields: {
          id: 'Int',
          name: 'String',
          email: 'String'
        }
      },
      Group: {
        fields: {
          id: 'Int',
          name: 'String',
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
              resolve: function (source, args, context, info) {
                return db.tables.user
              }
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
              resolve: function (source, args, context, info) {
                var newUser = _.merge({ id: 3 }, args)
                db2.tables.user.push(newUser)
                return db2.tables.user[db2.tables.user.length - 1]
              }
            }
          }
        }
      },
      GroupSchema: {
        query: {
          fields: {
            getGroups: {
              type: ['Group'],
              resolve: function (source, args, context, info) {
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
            }
          }
        }
      }
    }
  }

  // make lib
  var lib = factory.make(def)


  // queries
  var getQuery = '{ getUsers { id, name, email } }'
  var addQuery = 'mutation Mutation { addUser(name: "User3", email: "user3@domain.com") { id, name, email } }'
  var groupQuery = '{ getGroups { id, name, users { id, name, email } } }'

  it('Should return results from a query', function (done) {
    lib.UserSchema(getQuery).then(function (result) {
      expect(result).to.deep.equal({
        data: {
          getUsers: [
            {id: 1, name: 'User1', email: 'user1@domain.com' },
            {id: 2, name: 'User2', email: 'user2@domain.com' }
          ]
        }
      })
      done()
    }).catch(function () {
      done()
    })
  })

  it('Should return nested results from a query', function (done) {
    lib.UserSchema(groupQuery).then(function (result) {
      expect(result).to.deep.equal({
        data: {
          getGroups: [
            {
              id: 1,
              name: 'Group1',
              users: [
                {id: 1, name: 'User1', email: 'user1@domain.com' },
                {id: 2, name: 'User2', email: 'user2@domain.com' }
              ]
            },
            {
              id: 2,
              name: 'Group2',
              users: [
                {id: 2, name: 'User2', email: 'user2@domain.com' }
              ]
            }
          ]
        }
      })
      done()
    }).catch(function () {
      done()
    })
  })

  it('Should mutate the db and return the result', function (done) {
    lib.UserSchema(addQuery).then(function (result) {
      expect(result).to.deep.equal({
        data: {
          addUser: {id: 3, name: 'User3', email: 'user3@domain.com' }
        }
      })
      done()
    }).catch(function () {
      done()
    })
  })

  it('Should resolve the field definition and path', function (done) {
    var factoryDef = {
      types: {
        User: {
          fields: {
            id: 'Int',
            name: 'String',
            email: 'String'
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
                resolve: function (source, args, context, info) {
                  let rootDef = this.utils.getRootFieldDef(info)
                  let rootPath = this.utils.getFieldPath(info)

                  expect(rootDef).to.deep.equal({
                    type: ['User'],
                    _typeName: 'User'
                  })
                  expect(rootPath).to.deep.equal(['getUsers'])
                  return db.tables.user
                }
              }
            }
          }
        }
      }
    }
    var thisLib = factory.make(factoryDef)
    thisLib.UserSchema(getQuery).then(function () {
      done()
    }).catch(function () {
      done()
    })
  })
})