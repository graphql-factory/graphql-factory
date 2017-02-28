import GraphQLFactory from '../src/index'
import * as graphql from 'graphql'
import SubscriptionPlugin from '../src/plugins/subscription'

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
            resolve () {
              return [
                { id: '1', name: 'John Doe', email: 'jdoe@test.com' },
                { id: '2', name: 'Jane Doe', email: 'jdoe2@test.com' }
              ]
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
            resolve () {
              return new Promise(resolve => {
                setTimeout(() => {
                  resolve([
                    { id: '1', name: 'John Doe', email: 'jdoe@test.com' },
                    { id: '2', name: 'Jane Doe', email: 'jdoe2@test.com' }
                  ])
                }, 100)
              })
            }
          },
          subscribeB: {
            type: ['User'],
            args: {
              id: { type: 'String' },
              name: { type: 'String' },
              email: { type: 'String' }
            },
            resolve () {
              return [
                { id: '1', name: 'John Doe', email: 'jdoe@test.com' },
                { id: '2', name: 'Jane Doe', email: 'jdoe2@test.com' }
              ]
            }
          }
        }
      }
    }
  }
}

let lib = factory.make(definition, { plugin: [new SubscriptionPlugin()] })

lib.Users(`subscription subUUID {
  subscribeA { id, name, email }
  subscribeB { id }
}`, { root: 'i am groot' })
.then(result => {
  console.log(JSON.stringify(result, null, '  '))
  process.exit()
}, error => {
  console.dir(error)
  process.exit()
})