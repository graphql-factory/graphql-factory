var graphql = require('graphql')
var factory = require('../dist/index')

function hydrateDirective (schema, directiveName, backing) {
  var name = directiveName.replace(/^@/, '')

  schema._directives.forEach(directive => {
    if (directive.name === name) {
      Object.assign(directive, backing)
    }
  })
}

function hydrateSchema (schema, backing) {
  Object.keys(backing).forEach(key => {
    var keyBacking = backing[key]

    // check for directive backing
    if (key.match(/^@/)) {
      hydrateDirective(schema, key, keyBacking)
      return
    }

    // check for type
    if (schema._typeMap[key]) {
      var type = schema._typeMap[key]

      Object.keys(keyBacking).forEach(fieldName => {
        var resolve = keyBacking[fieldName]
        if (type._fields[fieldName] && typeof resolve === 'function') {
          type._fields[fieldName].resolve = resolve
        }
      })
    }
  })
}


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


var backing = {
  Query: {
    readFoo (source, args, context, info) {
      return Promise.resolve({
        id: '1',
        name: 'Foo'
      })
    }
  },
  '@remove': {
    resolveRequest (source, locations, context, info) {
      if (locations.FIELD && locations.FIELD.args.if) {
        return new graphql.GraphQLSkipInstruction()
      }
      return source
    },
    resolveResult (source) {
      return source
    }
  },
  '@modify': {
    resolveResult (source, locations, context, info) {
      if (locations.FIELD && locations.FIELD.args.value) {
        return locations.FIELD.args.value
      } else if (locations.FIELD_DEFINITION && locations.FIELD_DEFINITION.args.value) {
        return locations.FIELD_DEFINITION.args.value
      }
    }
  },
  '@test': {
    resolveRequest (source, locations, context, info) {
      console.log('REQUEST', locations)
    },
    resolveResult (source, locations, context, info) {
      console.log('RESULT', locations)
    }
  },
  '@acl': {
    resolveRequest (source, locations, context, info) {
      // console.log(info)
      var user = info.rootValue ? info.rootValue.user : ''
      var auth = function (args) {
        return acl[user] && acl[user].indexOf(args.permission) !== -1
      }

      if (locations.SCHEMA && !auth(locations.SCHEMA.args)) {
        throw new Error('Unauthorized at schema')
      } else if (locations.OBJECT && !auth(locations.OBJECT.args)) {
        throw new Error('Unauthorized at object')
      }
    }
  }
}

var schema = graphql.buildSchema(def)
hydrateSchema(schema, backing)

// console.log(schema)

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