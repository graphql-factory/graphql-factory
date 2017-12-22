import { SchemaDefinition, directives } from '../src'
import { printSchema, DirectiveLocation } from 'graphql'
import _ from 'lodash'

const data = [
  { id: '1', name: 'foo1' },
  { id: '2', name: 'foo2' },
  { id: '3', name: 'foo3' },
  { id: '4', name: 'foo4' }
]

const schema = new SchemaDefinition()
  .use({
    directives: {
      resolve: directives.resolve,
      test: {
        locations: _.values(DirectiveLocation),
        args: {
          value: { type: 'String' }
        },
        resolve(source, args, context, info) {
          console.log('TEST', info.location, args)
        }
      }
    }
  })
  .use((source, args) => _.find(data, args), 'readFoo')
  .use(`
    type Foo {
      id: String!
      name: String!
    }
    type Query {
      readFoo(id: String!): Foo
        @resolve(resolver: "readFoo")
        @test(value: "readFoo Field")
    }
    schema {
      query: Query
    }
  `)
  .use({ schema: { directives: [ 'resolve', 'test' ] } })
  .buildSchema()

schema.request({
  source: `
  query MyQuery {
    readFoo(id: "1") {
      id
      ...nameFragment
    }
  }
  
  fragment nameFragment on Foo {
    name @test(value: "name field fragment")
  }
  `
})
.then(console.log)
.catch(console.error)