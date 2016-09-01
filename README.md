# graphql-factory

Compose GraphQL objects with JSON definitions

---

`graphql-factory` is a JavaScript library that helps you build GraphQL Types and Schemas using JSON. The library follows the GraphQL spec as closely as possible and adds additional control fields to make type definition easier and more modular.

[![npm version](https://badge.fury.io/js/graphql-factory.svg)](https://badge.fury.io/js/graphql-factory) [![Build Status](https://travis-ci.org/graphql-factory/graphql-factory.svg?branch=master)](https://travis-ci.org/graphql-factory/graphql-factory) [![Dependency Status](https://david-dm.org/graphql-factory/graphql-factory.svg)](https://david-dm.org/graphql-factory/graphql-factory) [![devDependency Status](https://david-dm.org/graphql-factory/graphql-factory/dev-status.svg)](https://david-dm.org/graphql-factory/graphql-factory#info=devDependencies) [![Known Vulnerabilities](https://snyk.io/test/github/graphql-factory/graphql-factory/badge.svg)](https://snyk.io/test/github/graphql-factory/graphql-factory)

[![Join the chat at https://gitter.im/graphql-factory/Lobby](https://badges.gitter.im/graphql-factory.svg)](https://gitter.im/graphql-factory/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Usage

```js
import * as graphql from 'graphql'
import GraphQLFactory from 'graphql-factory'

let factory = GraphQLFactory(graphql)

```

## Documentation

* [WIKI](https://github.com/graphql-factory/graphql-factory/wiki)
* [Examples](https://github.com/graphql-factory/graphql-factory/wiki/Examples)
* [API Reference](https://github.com/graphql-factory/graphql-factory/wiki/API-Reference)

## Example

```js
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
