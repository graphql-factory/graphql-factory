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
import { backing, shoppingBacking } from './backing';

function randomBoolean () {
  return Math.random() >= 0.5;
}
import _ from 'lodash'

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
  listFoo: [Foo]
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

const shoppingDef = `
type Category {
  id: String!
  name: String!
}

type Item {
  id: String!
  name: String!
  category: Category!
}

input CategoryInput {
  name: String!
}

input ItemInput {
  name: String!
  category: CategoryInput!
}

type List {
  id: String!
  name: String!
  items: [Item]!
}

type Query @test(value: "query type") {
  listLists (search: String): [List] @test(value: "listListsDef")
  readList (id: String!): List @test(value: "readList")
}

type Mutation {
  createList (
    name: String!
    items: [ItemInput]!
  ): List
}

directive @test(value: String) on SCHEMA | OBJECT | QUERY | FIELD |
FIELD_DEFINITION | INPUT_FIELD_DEFINITION
directive @log(value: String) on SCHEMA | OBJECT | QUERY | FIELD |
INPUT_FIELD_DEFINITION
directive @change(value: String) on SCHEMA | OBJECT | QUERY | FIELD |
INPUT_FIELD_DEFINITION

schema @test(value: "schemaDef") {
  query: Query
  mutation: Mutation
}
`

const definition = new SchemaDefinition({ conflict: 'WARN' });
// const schema = buildSchema(def, backing)

definition.use(shoppingDef, shoppingBacking);
const schemaPromise = definition.buildSchema({ useMiddleware: true });

//console.log(schema);

/*
const factoryDef = deconstructSchema(schema)
console.log(JSON.stringify(factoryDef, null, '  '))
const exported = exportDefinition(factoryDef)
console.log(exported.definition)
console.log(exported.backing)
*/
// console.log(schema);

const multiQuery = `
query MyQuery @log(value: "logQuery") @test(value: "queryOp") {
  list1:listLists (search: "shop") @test(value: "id field") {
    ...ListFragment
    items {
      id
      name,
      category {
        ...CaregoryFragment
      }
    }
  }
  list2:listLists {
    ...ListFragment
  }
  rl:readList (id: "1") {
    ...ListFragment
  }
}

fragment CaregoryFragment on Category {
  id
  name
}

fragment ListFragment on List {
  id
  name @change(value: "im changed")
}
`
const querySource = `
query Query {
  x:listLists {
    id
    name
    items {
      id
      name
      category {
        id
        name
      }
    }
  }
}
`
const mutationSource = `
mutation TeenageNinjaTurtle {
  list1:createList (
    name: "TestList1"
    items: [
      {
        name: "Foo",
        category: {
          name: "Misc"
        }
      }
    ]
  ) {
    id
    name
    items {
      id
      name
      category {
        id
        name
      }
    }
  }
  list2:createList (
    name: "TestList2"
    items: [
      {
        name: "Foo1",
        category: {
          name: "Misc1"
        }
      }
    ]
  ) {
    id
    name
    items {
      id
      name
      category {
        id
        name
      }
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

schemaPromise.then(schema => {
  return schema.request({
    source: multiQuery
  });
})
.then(result => {
  console.log(JSON.stringify(result, null, '  '))
})
.catch(console.error)
