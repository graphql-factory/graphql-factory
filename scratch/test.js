import {
  SchemaDefinition,
  GraphQLSkipInstruction,
  request,
  buildSchema
} from '../src/index';
import {
  parse
} from 'graphql';
import { backing } from './backing';

const def = `
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

const definition = new SchemaDefinition({ context: {} });
const schema = buildSchema(def, backing)

// console.log(schema);

const source = `
query Query {
  readFoo {
    id
    name
  }
}
`

request({
  schema,
  source,
  rootValue: { user: 'admin' }
})
  .then(console.log)
  .catch(console.error)