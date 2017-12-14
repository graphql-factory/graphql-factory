import {
  buildSchema,
  print,
  printSchema
} from 'graphql'

const def = `
type Foo {
  id: String!
  name: String
}

type Query {
  readFoo(id: String!): Foo,
  listFoo: [Foo!]!
}

directive @test on SCHEMA

schema {
  query: Query
}
`

const schema = buildSchema(def);

console.log(schema.astNode)
// console.log(printSchema(schema))