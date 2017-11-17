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

function randomBoolean () {
  return Math.random() >= 0.5;
}

const def = `
type Foo @test(value: "FooObject") {
  id: String!
  name: String @modify(value: "****")
}

type Query @acl(permission: "read") {
  readFoo (
    foo: String,
    bar: String
  ): Foo
}

directive @test(value: String) on SCHEMA | OBJECT | QUERY | FIELD
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
query Query ($skip: Boolean!, $remove: Boolean!) @test(value: "queryOp") {
  readFoo(foo: "i am a foo") @test(value: "readFoo") {
    id @remove(if: $remove) @test(value: "idField")
    name @skip(if: $skip)
  }
}
`

const variableValues = {
  remove: false, // randomBoolean(),
  skip: false // randomBoolean()
};

const rootValue = { user: 'admin' }

request({ schema, source, rootValue, variableValues })
.then(console.log)
.catch(console.error)