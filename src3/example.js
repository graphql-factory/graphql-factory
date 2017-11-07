import _ from 'lodash'

function inspect (obj) {
  _.forEach(obj, (v, k) => {
    console.log(k, ':', v)
  })
}

import {
  graphql,
  GraphQLString,
  GraphQLObjectType,
  GraphQLSchema,
  parse,
  buildSchema,
  print,
  printSchema,
  astFromValue,
  GraphQLIncludeDirective,
  printIntrospectionSchema,
  introspectionQuery
} from 'graphql'

function fooResolve (source, args, context, info) {
  return { id: '1', name: 'foo' }
}

const Foo = new GraphQLObjectType({
  name: 'Foo',
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString }
  }
})

const FooQuery = new GraphQLObjectType({
  name: 'FooQuery',
  fields: {
    readFoo: {
      type: Foo,
      resolve: fooResolve
    }
  }
})

const FooSchema = new GraphQLSchema({
  query: FooQuery
})

const def = `
type Foo {
  id: String
  name: String,
  blah: String @skip
}

# a foo query
type FooQuery {
  # reads a foo
  readFoo: Foo
}

enum BLAH {
  ONE
  TWO
}

input FooInput {
  limit: Int = 10
}

schema {
  query: FooQuery
}
`

const FooSchema2 = buildSchema(def)
// FooSchema2._typeMap.FooQuery._fields.readFoo.resolve = fooResolve

console.log(FooSchema.astNode)
console.log('===========')
console.log(FooSchema2._typeMap.FooInput._fields)
console.log('===========')
// console.log(FooSchema._typeMap.FooQuery._fields)

// console.log('!', printSchema(FooSchema2))

/*
graphql(FooSchema2, `query Query {
  readFoo {
    id
    name
  }
}`)
.then(res => {
  console.log(JSON.stringify(res, null, '  '))
})
.catch(err => {
  console.error(err)
})
*/