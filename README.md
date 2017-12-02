# graphql-factory

Extensible tools for building graphql APIs

## About

GraphQL Factory is a toolkit for building graphql. It includes useful features like middleware,
plugin extensibility, schema decomposition/merging, and many more. It is designed to make building
graphql schemas quick with a familiar API. Please note that the current `v3` API is completely
different from the `v1/v2` API.

[Project Documentation](http://graphql-factory.github.io/graphql-factory)

### Example

```js
import * as graphql from 'graphql'
import GraphQLFactory from 'graphql-factory'

const factory = GraphQLFactory(graphql)

const definition = {
  types: {
    Foo: {
      fields: {
        id: 'ID!',
        name: 'String!',
        bars: '[String!]!'
      }
    },
    FooQuery: {
      fields: {
        readFoo: {
          type: 'Foo',
          args: {
            id: { type: 'ID!' }
          },
          resolve (source, args, context, info) {
            // resolve code
          }
        }
      }
    }
  },
  schemas: {
    FooSchema: {
      query: 'FooQuery'
    }
  }
}

const f = factory.use(definition)
const lib = f.library()

// log requests
f.on('request', console.log)

lib.request({
  schema: 'FooSchema',
  requestString: `
    query Query($id: ID!) {
      readFoo(id: $id) {
        id
        name
        bars
      }
    }
  `,
  variableValues: {
    id: '1'
  }
})
.then(result => {
  // use results
})

```