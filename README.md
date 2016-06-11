# graphql-factory
Compose GraphQL objects with JSON definitions

**Currently Developing**

[WIKI](https://github.com/bhoriuchi/graphql-factory/wiki) | [Examples](https://github.com/bhoriuchi/graphql-factory/wiki/Examples)

## About

`graphql-factory` allows you to define GraphQL objects and schemas without having to instantiate new objects in the process. The `make` method returns an object containing all of the GraphQL objects defined as well as convenience functions for calling your queries and mutations. By using JSON as the definition language you can more easily reuse pieces of configuration to build and extend object types while not worrying about type definitions.

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

## API

### `factory.registerTypes` ( `typeMap` )
Imports/registers types from other libraries for use in the factory definition

**parameters**
* `typeMap` `{RegisterTypeMap}` - A hash of custom types and their string reference
```
type RegisterTypeMap = {
  [typeName: string]: GraphQLObjectType
}
```

### `factory.make` ( `definition` ) `=>` `FactoryLib`
Creates all types and schemas. Returns an object containing the type objects as well as convenience methods for executing GraphQL queries/mutations on each schema

**returns**
```
type FactoryLib = {
  _definitions: FactoryDefinitionObject,
  [schemaQuery: string]: function
}

type FactoryDefinitionObject = {
  globals: object,
  definition: object,
  types: GraphQLObjectTypeMap,
  schemas: GraphQLSchemaMap,
  utils: factory.utils
}
```

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
  type?: FactoryTypeEnum | FactoryMultiTypeConfig, // defaults to GraphQLObject "Object"
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

type FactoryMultiTypeConfig = FactoryMultiTypeMap | Array<FactoryMultiType>

type FactoryMultiType = FactoryTypeEnum | FactoryMultiTypeMap

type FactoryTypeMap = {
  [typeName: string<FactoryTypeEnum>]: FactoryTypeName
}

// defines the name of the type, null, '', and undefined use the definition key
type FactoryTypeName = string | null | '' | undefined

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
* `omitFrom` - Used in conjunction with a multi-type definition to exclude fields from a definition or definitions of a specific type

```
type FactoryTypeConfigDefinition = FactorySimpleTypeConfig |
                                   FactoryTypeConfig |
                                   ConditionalFactoryTypeConfigMap

type FactorySimpleTypeConfig = string |
                               Array<string> |
                               GraphQLObject |
                               Array<GraphQLObject>

type ConditionalFactoryTypeConfigMap = {
  [typeName: FactoryTypeName]: FactorySimpleTypeConfig |
                               FactoryTypeConfig
}

type FactoryTypeConfig = {
  type: FactorySimpleTypeConfig,
  primary?: Boolean,
  nullable?: Boolean,
  omitFrom? : string | Array<string>
}
```

### definition.globals
The globals property of the definition object allow you to specify data that can be consumed by extended field resolve functions. `globals` is a basic javascript object so you can add strings, numbers, functions, etc.

### GraphQLFieldResolveFn "this" property
All user defined `GraphQLFieldResolveFn` objects are bound to the `FactoryDefinition` object so that they can access all types, schemas, globals, and the JSON definition using `this.<property>`

**NOTE** if you are using the `this` property inside your field resolve, the function itself or any functions it is nested under cannot be defined as arrow functions due to [Lexical This](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions). Instead define them using non-arrow syntax `function (arg1, ...) {}`. Using arrow functions will result in the `this` property being `undefined`

### Multi-Types
Some objects may be very similar in definition but have different types. One example is a `GraphQLInputObjectType` that has a subset of the fields in a `GraphQLObjectType` that is used for mutating that object type. In this case `graphql-factory` allows you to use a Multi-type definition in conjunction with the `omitFrom` field of a `FactoryTypeConfig` object to create both GraphQL objects from a single definition. This allows a reduction of redundant definition code but does add some complexity

* **Field Types** - You may have different requirements for the type of data that is returned for the same field name in a Multi-Type definition. To accomplish this you can use a `ConditionalFactoryTypeConfigMap` which will allow you to specify a type configuration for each of your Multi-types. This is useful in particular when you have a field that only requires an `id` string on mutation but returns a more complex object on query. See example `User.location` field definition

#### Multi-Type Example Definition


```
let definition = {
  types: {
    User: {
      type: [ 'Object', 'Input' ]
      // Equivalent to [ 'Object', { Input: 'UserInput' } ]
      // Equivalent to [ { Object: 'User' }, { Input: 'UserInput' } ]
      // Equivalent to { Object: 'User', Input: 'UserInput' },
      // Equivalent to { Object: null, Input: null }
      fields: {
        id: {
          type: 'String',
          primary: true,
          omitFrom: [ 'Input' ]
        },
        name: {
          type: 'String',
          nullable: false
        },
        email: {
          type: 'String',
          resolve: function () {
              // object resolve
          }
        },
        location: {
          Object: 'Location',
          Input: {
            type: 'String',
            nullable: false
          }
        }
      }
    }
  }
}
```

Will create

```
const Location = new GraphQLObject({...})

const User = new GraphQLObject({
  name: 'User',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    email: {
      type: GraphQLString,
      resolve: function () {
        // object resolve
      }
    },
    location: {
      type: Location
    }
  }
})

const UserInput = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: GraphQLString },
    location: {
      type: new GraphQLNonNull(GraphQLString)
    }
  }
})
```

### resolveType for Union
Since Union types require the use of already created GraphQL types, they are created after all other types except `GraphQLSchema`. When returning types in your `resolveType` function you need to return the resolvedType (thanks captain obvious). The best way to do this is to reference the `this._types` array inside your `resolveType` function. The array is indexed in the order that you specified your types. See below for example

```
let definition = {
  types: {
    Cat: {
      fields: {
        catName: { type: 'String' }
      }
    },
    Dog: {
      fields: {
        dogName: { type: 'String' }
      }
    },
    Pet: {
      type: 'Union',
      types: [ 'Cat', 'Dog' ],
      resolveType: function (value, info) {

        // do NOT use arrow functions here to avoid lexical this
        if (value.catName) return this._types[0]
        else if (value.dogName) return this._types[1]
      }
    }
  }
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
In order to remove the depedency on `lodash` several lodash-like functions have been implemented and are available for use in the `factory.utils` module. They are lodash-like because some may only provide partial functionality of their lodash equivalents. There are also utils for use with graphql. The methods are briefly documented below

The utils are also added to the `FactoryDefinitionObject` so that you can use them in field resolve functions by `this.utils.<Function>`

* Lodash Emulation
  * `factory.utils.isObject` ( `object` )
  * `factory.utils.isArray` ( `object` )
  * `factory.utils.isFunction` ( `object` )
  * `factory.utils.isDate` ( `object` )
  * `factory.utils.isHash` ( `object` )
  * `factory.utils.isString` ( `object` )
  * `factory.utils.includes` ( `array`, `value` )
  * `factory.utils.has` ( `object`, `function(value, key)` )
  * `factory.utils.forEach` ( `object`, `function(value, key)` )
  * `factory.utils.without` ( `object`, `value1`, ... )
  * `factory.utils.map` ( `object`, `function(value, key)` )
  * `factory.utils.mapValues` ( `object`, `function(value, key)` )
  * `factory.utils.filter` ( `object`, `function(value, key)` )
  * `factory.utils.omitBy` ( `object`, `function(value, key)` )
  * `factory.utils.pickBy` ( `object`, `function(value, key)` )
  * `factory.utils.mergeDeep` ( `object`, `object`, ... )

* GraphQL tools
  * `factory.utils.getReturnTypeName` ( `GraphQLResolveInfo` )

### FAQ
**Q**: Why do I need to pass a `graphql` instance to `graphql-factory` ?

**A**: There is a known issue with running multiple versions of `graphql` in the same project. By passing in the version your project is already using we eliminate multiple version issues.

**Q** How do I reuse pieces of a schema?

**A** The approach I use is to create partial objects and use a utility like lodash's `_.deepMerge` to add its schema to another
##### Example
```
import _ from 'lodash'

let partial = {
  reusableField: {
    type: 'String',
    resolve: resolveFn
  }
}

let definition = {
  types: {
    type1: {
      fields: _.mergeDeep({
        field1: { type: 'String' },
        field2: { type: 'Int' }
      }, partial)
    },
    type2: {
      fields: _.mergeDeep({
        fieldA: { type: 'Boolean' },
        fieldB: { type: 'String' }
      }, partial)
    }
  }
}
```