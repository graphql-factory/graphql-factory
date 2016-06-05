# graphql-factory
Compose GraphQL objects with JSON definitions

**Currently Developing**

`graphql-factory` allows you to define GraphQL objects, types, and schemas using JSON. GraphQL definitions are passed to the make function which outputs an object containing all objects, types, schemas, enums, etc. along with functions to execute queries on each defined schema

### Basic Example
```
import * as graphql from 'graphql'
let factory = require('graphql-factory')(graphql)

let definition = {
  types: {
    EnumStatus: {
      $$type: 'Enum',
      OFFLINE: 'OFFLINE',
      ONLINE: 'ONLINE'
    },
    User: {
      id: { type: 'String', primary: true },
      name: { type: 'String' },
      email: { type: 'String', nullable: true }
      status: { type: 'EnumStatus' }
    }
  },
  schemas: {
    Users: {
      query: {
        users: {
          type: ['User'],
          resolve: (obj, args, source, fieldASTs) => {
            // resolve code
          }
        }
      },
      mutation: {
        create: {
          type: 'User',
          args: {
            name: { type: 'String' },
            email: { type: 'String', nullable: true },
            status: { type: 'EnumStatus' },
            resolve: (obj, args, source, fieldASTs) => {
              // resolve code
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

### API

#### `factory.make`( `definition` )
* `definition` `{ Object }` - GraphQL definition object
*Creates all defined types and schemas and returns an object with callable query functions for each schema*

#### `factory.registerTypes` ( `typesHash` )
* `typesHash` `{ Object }` - A hash of key-value pairs where the key is the type name to reference and the value is the type object
*Adds custom types so that they can be referenced using a key defined in the hash passed*

### Definition
`graphql-factory` uses a similar definition strategy as `graphql` itself. The difference is that `graphql-factory` collapses certain paths like fields and instead uses options arguments ($$) to override properties like name. The example is a good place to reference the structure of a definition or the example included in the examples directory

* **Types** - are specified by string literals that map to either a type in the current definition, a graphql type, or a custom type that has been registered. You may also use a type object. For convenience 'String', 'Int', 'Boolean', and 'Float' are mapped to the appropriate graphql type objects
* **Lists** - placing the type object or string literal inside an array identifies it as a list type for example `['String']` will create a list of type `GraphQLString`
* **NonNulls** - by default, all fields are NonNulls. If a field needs to be nullable a `nullable = false` should be specified. See example

### FAQ
**Q**: Why do I need to pass a `graphql` instance to `graphql-factory`
**A**: There is a known issue with running multiple versions of `graphql` in the same project. By passing in the version your project is already using we eliminate multiple version issues.
