import {
  SchemaDefinition,
  GraphQLSkipInstruction,
  request,
  buildSchema,
  deconstructSchema
} from '../src/index';
import {
  parse
} from 'graphql';
import { backing } from './backing';

function randomBoolean () {
  return Math.random() >= 0.5;
}

const def = `
scalar JSON

type Bar {
  id: String!  @modify(value: "****")
  name: String
}
type Foo @test(value: "FooObject") {
  id: String!
  name: String @modify(value: "****")
  bars: [Bar]
}

input FooInput {
  bar: String
}

type Query @acl(permission: "read") {
  readFoo(
    foo: String @test(value: "fooArg") @remove(if: true),
    bar: String
  ): Foo
}

directive @test(value: String) on SCHEMA | OBJECT | QUERY | FIELD |
  INPUT_FIELD_DEFINITION
directive @acl(permission: String) on SCHEMA | OBJECT
directive @remove(if: Boolean!) on FIELD | INPUT_FIELD_DEFINITION
directive @modify(value: String) on FIELD | FIELD_DEFINITION
directive @meta(data: JSON, foo: FooInput) on SCHEMA

schema @meta(data: { level1: 1 }, foo: { bar: "baz"} ) {
  query: Query
}
`

const definition = new SchemaDefinition({ context: {} });
const schema = buildSchema(def, backing)

console.log(deconstructSchema(schema).types.Query.fields.readFoo)


// console.log(schema);

/*
const source = `
query Query ($skip: Boolean!) @test(value: "queryOp") {
  readFoo(
    foo: "i am a foo",
    bar: "i am a bar"
  ) @test(value: "readFoo") {
    id @test(value: "idField") @remove(if: true) 
    name @skip(if: $skip)
    bars {
      id
      name
    }
  }
}
`

function logger (type, data) {
  const { start, end, duration } = data;
  console.log({ start, end, duration })
  // console.log(JSON.stringify(data, null, '  '))
}

const variableValues = {
  remove: true, // randomBoolean(),
  skip: false // randomBoolean()
};

const rootValue = { user: 'admin' }

request({ schema, source, rootValue, variableValues, logger })
.then(result => {
  console.log(JSON.stringify(result, null, '  '))
})
.catch(console.error)
*/