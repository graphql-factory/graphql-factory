import {
  buildSchema,
} from 'graphql';
import {
  request,
  FactoryTracingExtension,
} from '../src';
import _ from 'lodash';

const source = `
query MyQ ($value: String) {
  foos @test(value: $value) {
    id @test(value:"non frag id")
    ...fooFields
  }
}
fragment fooFields on Foo {
  name @test(value:"name in frag")
}
`

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
directive @rename(name: String!) on OBJECT
`

const schema = buildSchema(definition);
const testDirective = schema.getDirective('test');
const renameDirective = schema.getDirective('rename');
testDirective._ext = {
  visitSchemaNode(args, info) {
    //console.log('visited schema node, args:', args)
  },
  visitFieldNode(args, info) {
    console.log('visited field', args)
  },
  visitArgumentDefinitionNode(args) {
    //console.log('visited argdef', args)
  },
  visitInputFieldDefinitionNode(args) {
    //console.log('visited fielddef', args)
  },
  beforeField(source, args) {
    console.log('@test - beforeField', args);
  },
  beforeFieldDefinition(source, args) {
    //console.log('before mw', args)
  },
  beforeSchema() {
    //console.log('@test - SCHEMA')
  }
}

renameDirective._ext = {
  visitObject(obj, args) {
    obj.name = args.name;
  }
}

const variableValues = {
  value: 'testvalue'
};

const extensions = {
  tracing: new FactoryTracingExtension({
    detailed: true,
  }),
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