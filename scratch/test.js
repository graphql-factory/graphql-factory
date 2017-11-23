import {
  SchemaDefinition,
  GraphQLSkipInstruction,
  request,
  buildSchema,
  deconstructSchema,
  exportDefinition
} from '../src/index';
import {
  parse,
  GraphQLDirective,
  astFromValue,
  graphql
} from 'graphql';
import { backing } from './backing';

function randomBoolean () {
  return Math.random() >= 0.5;
}

const def = `
scalar JSON

enum STATE {
  ACTIVE
  INACTIVE
}

type Bar {
  id: String!  @modify(value: "****")
  name: String
}
type Foo @test(value: "FooObject") {
  id: String!
  name: String @modify(value: "****")
  bars: [Bar]
}

union BarUnion = Bar

input FooInput {
  bar: String
}

type Query @acl(permission: "read") {
  readFoo(
    foo: String @test(value: "fooArg") @remove(if: true),
    bar: String
  ): Foo
}

interface IFace {
  stuff: String
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

const def2 = `
type Bee {
  id: ID
}

type Query {
  readBee: Bee
}

schema {
  query: Query
}
`

const definition = new SchemaDefinition({ conflict: 'WARN' });
// const schema = buildSchema(def, backing)

definition.use(def, backing);
const schema = definition.buildSchema();

//console.log(schema);

/*
const factoryDef = deconstructSchema(schema)
console.log('factory', factoryDef)
const exported = exportDefinition(factoryDef)
console.log(exported.definition)
console.log(exported.backing)
*/
// console.log(schema);


const source = `
query Query @test(value: "queryOp") {
  readFoo(
    foo: "i am a foo",
    bar: "i am a bar"
  ) @test(value: "readFoo") {
    id @test(value: "idField") @remove(if: true) 
    name
    bars {
      id
      name
    }
  }
}
`
/*
function logger (type, data) {
  const { start, end, duration } = data;
  console.log({ start, end, duration })
  // console.log(JSON.stringify(data, null, '  '))
}
*/

graphql({
  schema,
  source
})
.then(result => {
  console.log(JSON.stringify(result, null, '  '))
})
.catch(console.error)

/*


const rootValue = { user: 'admin' }

request({ schema, source, rootValue, variableValues, logger })
.then(result => {
  console.log(JSON.stringify(result, null, '  '))
})
.catch(console.error)
*/