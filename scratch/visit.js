import {
  buildSchema,
} from 'graphql';
import {
  request,
  FactoryTracingExtension,
} from '../src';
import _ from 'lodash';

const source = `query MyQ ($value: String) {
  foos @test(value: $value) {
    id
    name
  }
}`

const definition = `
type Foo {
  id: ID! @test(value: "id field")
  name: String!
}

input Bar {
  baz: String @test(value: "input value")
  qux: String
}

type Query {
  foos (id: Bar @test(value: "argdef")): [Foo]
}

schema @test(value: "schemadef") {
  query: Query
}

directive @test(value: String) on SCHEMA | FIELD_DEFINITION | FIELD | ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
directive @resolve on FIELD_DEFINITION
`

const schema = buildSchema(definition);
const testDirective = schema.getDirective('test');

testDirective._ext = {
  visitSchema(args, info) {
    console.log('visited schema node, args:', args)
  },
  visitField(args, info) {
    console.log('visited field', args)
  },
  visitArgumentDefinition(args) {
    console.log('visited argdef', args)
  },
  visitInputFieldDefinition(args) {
    console.log('visited fielddef', args)
  },
  beforeFieldDefinition(source, args) {
    console.log('before mw', args)
  },
  beforeSchema() {
    console.log('@test - SCHEMA')
  }
}
const variableValues = {
  value: 'testvalue'
};

const extensions = {
  tracing: FactoryTracingExtension,
}

const rootValue = {
  foos: () => {
    return [
      { id: 'foo1', name: 'Foo One'}
    ]
  }
}

// graphql(runtimeSchema, print(sourceNodes), rv, undefined, varVals)
request({
  schema,
  source,
  rootValue,
  variableValues,
  extensions,
})
.then(data => {
  console.log(JSON.stringify(data, null, 2))
})
.catch(console.error)