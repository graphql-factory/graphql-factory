var graphql = require('graphql')
var factory = require('../dist/index')

var acl = {
  admin: ['create', 'read', 'update', 'delete'],
  user: ['read']
}

var def = `
type Foo @test(value: "FooObject") {
  id: String!
  name: String @modify(value: "****")
}

type Query @acl(permission: "read") {
  readFoo: Foo
}

directive @test(value: String) on SCHEMA | OBJECT
directive @acl(permission: String) on SCHEMA | OBJECT
directive @remove(if: Boolean!) on FIELD
directive @modify(value: String) on FIELD | FIELD_DEFINITION

schema {
  query: Query
}
`

var backing = new factory.GraphQLSchemaBacking()
  .Object('Query')
    .resolve('readFoo', () => {
      return Promise.resolve({
        id: '1',
        name: 'Foo'
      })
    })
  .Directive('remove')
    .resolveRequest((source, locations) => {
      if (locations.FIELD && locations.FIELD.args.if) {
        return new factory.GraphQLSkipInstruction()
      }
      return source
    })
    .resolveResult(source => {
      return source
    })
  .Directive('modify')
    .resolveResult((source, locations) => {
      if (locations.FIELD && locations.FIELD.args.value) {
        return locations.FIELD.args.value
      } else if (locations.FIELD_DEFINITION && locations.FIELD_DEFINITION.args.value) {
        return locations.FIELD_DEFINITION.args.value
      }
    })
  .Directive('test')
    .resolveRequest((source, locations) => {
      console.log('REQUEST', locations)
    })
    .resolveResult((source, locations) => {
      console.log('RESULT', locations)
    })
  .Directive('acl')
    .resolveRequest((source, locations, context, info) => {
      var user = info.rootValue ? info.rootValue.user : ''
      var auth = function (args) {
        return acl[user] && acl[user].indexOf(args.permission) !== -1
      }

      if (locations.SCHEMA && !auth(locations.SCHEMA.args)) {
        throw new Error('Unauthorized at schema')
      } else if (locations.OBJECT && !auth(locations.OBJECT.args)) {
        throw new Error('Unauthorized at object')
      }
    })
  .backing

var schema = factory.buildSchema(def, backing)

factory.request({
  schema,
  source: `
    query Query {
      readFoo {
        id @remove(if: true)
        name
      }
    }
  `,
  rootValue: { user: 'admin' }
})
  .then(console.log)
  .catch(console.error)