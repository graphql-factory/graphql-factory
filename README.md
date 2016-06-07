# graphql-factory
Compose GraphQL objects with JSON definitions

**Currently Developing**

## About

`graphql-factory` allows you to define GraphQL objects and schemas without having to instantiate new objects in the process. The `make` method returns an object containing all of the GraphQL objects defined as well as convenience functions for calling your queries and mutations. By using JSON as the definition language you can more easily reuse pieces of configuration to build and extend object types while not worrying about type definitions.

## Example

```
import * as graphql from 'graphql'
let factory = require('graphql-factory')(graphql)
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

## API

### `factory.registerTypes` ( `typeMap` )
Imports/registers types from other libraries for use in the factory definition

**parameters**
* `typeHash` `{RegisterTypeMap}` - A hash of custom types and their string reference
```
type RegisterTypeMap = {
  [typeName: string]: GraphQLObjectType
}
```

### `factory.make` ( `definition` )
Creates all types and schemas. Returns an object containing the type objects as well as convenience methods for executing GraphQL queries/mutations on each schema

**parameters**
* `definition` `{FactoryDefinition}` - A JSON definition of all GraphQL types and schemas see official [`GraphQL Type Documentation`](http://graphql.org/docs/api-reference-type-system/) for reference
```
type FactoryDefinition = {
  types: FactoryTypeDefinitionMap,
  schemas: FactorySchemaDefinitionMap
}

type FactoryTypeDefinitionMap = {
  [typeName: string]: FactoryTypeDefinition
}

type FactorySchemaDefinitionMap = {
  [schemaName: string]: FactorySchemaDefinition
}

// FactoryTypeDefinition is merged into a modified GraphQL definition, see below
type FactoryTypeDefinition = {
  type?: ?FactoryTypeEnum, // defaults to GraphQLObject
  // ...Additional type specific fields
}

type FactoryTypeEnum = {
  Object: "Object",       // GraphQLObjectType
  Enum: "Enum",           // GraphQLEnumType
  Input: "Input",         // GraphQLInputObjectType
  Scalar: "Scalar",       // GraphQLScalarType
  Interface: "Interface", // GraphQLInterfaceType
  Union: "Union"          // GraphQLUnionType
}

type FactorySchemaDefinition = {
  query: FactoryObjectDefinition
  mutation?: ?FactoryObjectDefinition
}

type FactoryObjectDefinition = {
  // see notes
}

type ScalarTypeEnum = {
  String: GraphQLString,
  Int: GraphQLInt,
  Boolean: GraphQLBoolean,
  Float: GraphQLFloat,
  ID: GraphQLID
}
```

### FactoryObjectDefinition and FactoryTypeDefinition
These objects follow the official [`GraphQL Type Documentation`](http://graphql.org/docs/api-reference-type-system/) closely. One difference is that instead of supplying a GraphQL type object in the `type` field, you should instead specify a `FactoryTypeConfigDefinition`

* `GraphQLList` - List types are defined by placing the type object or `ScalarTypeEnum` in an array object (see example)
* `GraphQLNonNull` - Non-nulls are defined by providing a `FactoryTypeConfig` and setting `nullable = false`

```
type FactoryTypeConfigDefinition = FactorySimpleTypeConfig | FactoryTypeConfig

type FactorySimpleTypeConfig = string | Array<string> | GraphQLObject | Array<GraphQLObject>

type FactoryTypeConfig = {
  type: FactorySimpleTypeConfig,
  primary?: Boolean,
  nullable?: Boolean
}
```

### Name field
If the name field is omitted from a definition, the field key will be used for the name field value


### Convenience Functions
The `factory.make()` method returns an object containing all of the GraphQL objects created under `._definitions` and methods for running queries on each schema defined. To run a query simply pass the GraphQL query to the convenience function
```
let lib = factory.make(definition)
lib.<Schema Name>(<GraphQL Query>)
```

### `factory.utils`
In order to remove the depedency on `lodash` several lodash-like functions have been implemented and are available for use in the `factory.utils` module. They are lodash-like because some only emulate some of the functionality that their lodash equivalents provide. The methods are briefly documented below

* `factory.utils.isObject` ( `object` )
* `factory.utils.isArray` ( `object` )
* `factory.utils.isFunction` ( `object` )
* `factory.utils.isDate` ( `object` )
* `factory.utils.isHash` ( `object` )
* `factory.utils.has` ( `object`, `function(value, key)` )
* `factory.utils.forEach` ( `object`, `function(value, key)` )
* `factory.utils.without` ( `object`, `value1`, ... )
* `factory.utils.map` ( `object`, `function(value, key)` )
* `factory.utils.mapValues` ( `object`, `function(value, key)` )

### FAQ
**Q**: Why do I need to pass a `graphql` instance to `graphql-factory`

**A**: There is a known issue with running multiple versions of `graphql` in the same project. By passing in the version your project is already using we eliminate multiple version issues.
