import GraphQLFactory from '../src/index'
import * as graphql from 'graphql'
import SubscriptionPlugin from '../src/plugins/subscription'
import rethinkdbdash from 'rethinkdbdash'

let r = rethinkdbdash({ silent: true })
let factory = GraphQLFactory(graphql)

const definition = {
  types: {
    User: {
      fields: {
        id: { type: 'String', primary: true },
        name: { type: 'String' },
        email: { type: 'String' }
      }
    }
  },
  schemas: {
    Users: {
      query: {
        fields: {
          listUsers: {
            type: ['User'],
            args: {
              id: { type: 'String' },
              name: { type: 'String' },
              email: { type: 'String' }
            },
            resolve (source, args) {
              return r.table('user').filter(args).run()
            }
          }
        }
      },
      subscription: {
        fields: {
          subscribeA: {
            type: ['User'],
            args: {
              id: { type: 'String' },
              name: { type: 'String' },
              email: { type: 'String' }
            },
            resolve (source, args, context, info) {
              let _query = r.table('user').filter(args)

              let create = function (change, data) {
                return _query.changes().run().then(cursor => {
                  data.cursor = cursor
                  return cursor.each(error => {
                    if (!error) change()
                  })
                })
              }

              let destroy = function (data) {
                return data.cursor.close()
              }

              this.subscriptionSetup(info, create, destroy)
              return _query.run()
            }
          },
          unsubscribe: {
            type: 'Boolean',
            args: {
              subscriber: 'String'
            },
            resolve (source, args, context, info) {
              return this.subscriptionRemove(args)
            }
          },
          subscribeB: {
            type: ['User'],
            args: {
              id: { type: 'String' },
              name: { type: 'String' },
              email: { type: 'String' }
            },
            resolve (source, args, context, info) {
              let _query = r.table('user').filter(args)
              this.subscriptionSetup(info, function (change, data) {
                return _query.changes().run().then(cursor => {
                  data.cursor = cursor
                  return cursor.each(error => {
                    if (!error) change()
                  })
                })
              })
              return _query.run()
            }
          }
        }
      }
    }
  }
}

let lib = factory.make(definition, {
  plugin: [
    new SubscriptionPlugin()
  ]
})

lib.on('mysub', data => {
  console.log(JSON.stringify({ feed: data }, null, '  '))
})

lib.Users(`subscription mysub {
  subscribeA { id, name, email }
  subscribeB { id }
}`, { root: 'i am groot' })
.then(result => {
  console.log(JSON.stringify(result, null, '  '))
  // setTimeout(() => process.exit(), 100)
}, error => {
  console.dir(error)
  // setTimeout(() => process.exit(), 100)
})