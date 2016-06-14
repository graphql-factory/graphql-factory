# graphql-factory

Compose GraphQL objects with JSON definitions

---

`graphql-factory` is a JavaScript library that helps you build GraphQL Types and Schemas using JSON. The library follows the GraphQL spec as closely as possible and adds additional control fields to make type definition easier and more modular.

## Usage

```
import * as graphql from 'graphql'
import GraphQLFactory from 'graphql-factory'

let factory = GraphQLFactory(graphql)

```

## Documentation

* [WIKI](https://github.com/bhoriuchi/graphql-factory/wiki)
* [Examples](https://github.com/bhoriuchi/graphql-factory/wiki/Examples)
* [API Reference](https://github.com/bhoriuchi/graphql-factory/wiki/API-Reference)

## Example

```
import * as graphql from 'graphql'
import GraphQLFactory from 'graphql-factory'

let factory = GraphQLFactory(graphql)

let definition = {
  types: {
    EnumUserStatus: {
      type: 'Enum',
      values: {
        OFFLINE: 'OFFLINE',
        ONLINE: 'ONLINE'
      }
    },
    User: {
      fields: {
        id: { type: 'String', primary: true },
        name: { type: 'String', nullable: false },
        email: { type: 'String' },
        status: { type: 'EnumUserStatus' }
      }
    }
  },
  schemas: {
    Users: {
      query: {
        fields: {
          users: {
            type: ['User'],
            resolve: (root, args) => {
              // query code
            }
          }
        }
      },
      mutation: {
        fields: {
          create: {
            type: 'User',
            args: {
              name: { type: 'String', nullable: false  },
              email: { type: 'String'},
              status: { type: 'EnumUserStatus' }
            },
            resolve: (obj, args, source, fieldASTs) => {
              // create code
            }
          }
        }
      }
    }
  }
}

let lib = factory.make(definition)
lib.Users('{ users { id, name, email } }').then(function (result) {
  // do something with the result
})
```
