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

  // make lib
  var lib = factory.make(def, {
    beforeResolve: [
      function (args, next) {
        console.log('before middleware1')
        next()
      },
      function (args, next) {
        console.log('before middleware2')
        next()
      }
    ],
    afterResolve: function (args, result, next) {
      console.log('after middleware', result)
      next()
    }
  })


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
    }).catch(function (err) {
      done(err)
    })
  })

  it('Should return nested results from a query', function (done) {
    lib.GroupSchema(groupQuery).then(function (result) {
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
    }).catch(function (err) {
      done(err)
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
    }).catch(function (err) {
      done(err)
    })
  })

  it('Should resolve the field definition and path and contain a compiled definiton', function (done) {
    var factoryDef = {
      functions: {
        resolveUsers: function (source, args, context, info) {
          var rootDef = this.utils.getRootFieldDef(info)
          var rootPath = this.utils.getFieldPath(info)

          expect(info.schema._factory).to.deep.equal({
            key: 'UserSchema1',
            queryDef: {
              type: 'Object',
              fields: {
                getUsers: {
                  resolve: 'resolveUsers',
                  type: ['User'],
                  _typeName: 'User'
                },
                get1: {
                  resolve: 'resolveUsers',
                  type: ['User'],
                  _typeName: 'User'
                }
              }
            },
            mutationDef: {},
            subscriptionDef: {}
          })
          expect(rootDef).to.deep.equal({
            type: ['User'],
            _typeName: 'User'
          })
          expect(rootPath).to.deep.equal(['getUsers'])
          return db.tables.user
        }
      },
      fields: {
        Entity: {
          id: 'Int',
          name: 'String',
        },
        SchemaQuery: {
          get: {
            resolve: 'resolveUsers'
          }
        }
      },
      types: {
        User: {
          extendFields: 'Entity',
          fields: {
            email: 'String'
          }
        }
      },
      schemas: {
        UserSchema1: {
          query: {
            extendFields: {
              SchemaQuery: {
                get: [
                  {
                    name: 'getUsers',
                    type: ['User'],
                    _typeName: 'User'
                  },
                  {
                    type: ['User'],
                    _typeName: 'User'
                  }
                ]
              }
            },
            fields: {}
          }
        }
      }
    }
    var thisLib = factory.make(factoryDef)
    thisLib.UserSchema1(getQuery).then(function () {
      done()
    }).catch(function (err) {
      done(err)
    })
  })
})