# GraphQL Factory Definition

A construct for designing and building GraphQL schemas

## SchemaDefinition

The `SchemaDefinition` class allows the developer to programatically
build a schema definition in **GraphQL Factory Definition Format**
(here on refered to as `GFD` format) using a simple yet powerful API.

### .use()

The `use` method is the swiss army knife of a `SchemaDefinition`. At a high
level, it allows the developer to import and merge data into the definition.
The use method allows the developer to add `SchemaDefinition`,
`GraphQLSchema`, `GraphQLNamedType`, `GraphQLDirective`, `Function`,
`GraphQLFactoryPlugin`, `Object`, `SchemaBacking`, and `Schema Language`
definitions all to the same `SchemaDefinition` merging each with customizable
merge conflict resolution methods.

**Example**

```js
const BarType = new GraphQLObjectType({
  name: 'Bar',
  fields: {
    id: { type: GraphQLString }
  }
});

const def1 = new SchemaDefinition()
  .use(BarType)
  .use({
    types: {
      Foo: {
        type: 'Object',
        fields: {
          id: { type: 'String!' },
          bar: { type: 'Bar' }
        }
      }
    }
  });

const def2 = new SchemaDefinition()
  .use({
    context: {
      debug: true
    }
  })
  .use(def1)
  .use({
    types: {
      Query: {
        readFoo: {
          type: 'Foo',
          args: {
            id: { type: 'String!' }
          },
          resolve(source, args, context, info) {
            // resolve code
          }
        }
      }
    },
    schema: {
      query: 'Query'
    }
  });
```

In the previous code we

1. Created a new `SchemaDefinition` instance `def1`
2. Imported an instance of `GraphQLObjectType` (BarType) into `def1`
3. Imported the type `Foo` in `GFD` format into `def1`
4. Created a new `SchemaDefinition` instance `def2`
5. Imported `context` to be made available to all requests into `def2`
6. Imported `SchemaDefinition` `def1` into `def2`
7. Imported type `Query` and a schema in `GFD` format into `def2`

In the end `def2` should contain a `context` object, `Foo`, `Bar`, and `Query`
types as well as a schema definition.

### Merging and Name Conflict Resolution

Each call to `use` merges the contents of use into the schema definition. 
It is highly likely that defintions have a wide range of merge requirements.
One type may need to always overwrite another with the same name while some
may need their definitions merged together. Others may need to throw errors.
To deal with conflict resolution the developer can specify global and object
level conflict resolution rules or custom methods.

#### Global Conflict Resolution

A custom conflict resolution resolver can be defined on the `SchemaDefinition`
otherwise the default conflict resolution resolver will be used.

#### Conflict Resolution Rules

Are defined at the object level using the `onConflict` key. The value can be
either a `ConflictResolution` ENUM value or a function that takes the arguments

*  definition: SchemaDefinition
*  store: Definition store (`types`, `directives`, etc.)
*  name: Name of Object with conflict
*  target: Current value
*  source: Proposed value

And returns

```js
{ name: nameToUse, value: valueToUse }
```