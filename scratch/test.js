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
  readFoo(
    foo: String @test(value: "fooArg") @remove(if: true),
    bar: String
  ): Foo
}

directive @test(value: String) on SCHEMA | OBJECT | QUERY | FIELD | INPUT_FIELD_DEFINITION
directive @acl(permission: String) on SCHEMA | OBJECT
directive @remove(if: Boolean!) on FIELD | INPUT_FIELD_DEFINITION
directive @modify(value: String) on FIELD | FIELD_DEFINITION

schema {
  query: Query
}
`

const definition = new SchemaDefinition({ context: {} });
const schema = buildSchema(def, backing)

// console.log(schema);

const source = `
query Query ($skip: Boolean!) @test(value: "queryOp") {
  readFoo(
    foo: "i am a foo",
    bar: "i am a bar"
  ) @test(value: "readFoo") {
    id @test(value: "idField") @remove(if: true) 
    name @skip(if: $skip)
  }
}
`

const variableValues = {
  remove: true, // randomBoolean(),
  skip: false // randomBoolean()
};

const rootValue = { user: 'admin' }

request({ schema, source, rootValue, variableValues })
.then(console.log)
.catch(console.error)