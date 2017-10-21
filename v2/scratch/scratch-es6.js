import * as graphql from 'graphql'
import GraphQLFactory from '../../src/index'
import _ from 'lodash'

const logger = {
  error (log) {
    console.log(log)
  }
}

let factory = GraphQLFactory(graphql)

let definition = {
  types: {
    Foo: {
      fields: {
        id: { type: 'String', primary: true },
        name: { type: 'String', nullable: false }
      }
    },
    Bar: {
      fields: {
        id: { type: 'String', primary: true },
        name: { type: 'String', nullable: false }
      }
    }
  },
  schemas: {
    Foos: {
      query: {
        fields: {
          listFoo: {
            type: ['Foo'],
            resolve (source, args, context, info) {
              return [{ id: 'foo1', name: 'Foo1' }]
            }
          }
        }
      },
      mutation: {
        fields: {
          createFoo: {
            type: 'Foo',
            args: {
              name: { type: 'String', nullable: false  }
            },
            resolve (source, args, context, info) {
              return { id: 'foo1', name: 'Foo1' }
            }
          }
        }
      }
    },
    Bars: {
      query: {
        fields: {
          listBar: {
            type: ['Bar'],
            resolve (source, args, context, info) {
              return [{ id: 'bar1', name: 'Bar1' }]
            }
          }
        }
      },
      mutation: {
        fields: {
          createBar: {
            type: 'Bar',
            args: {
              name: { type: 'String', nullable: false  }
            },
            resolve (source, args, context, info) {
              return { id: 'bar1', name: 'Bar1' }
            }
          }
        }
      }
    }
  }
}

//let lib = factory.make(definition)

//const FoosSchema = lib.Foos.schema
//const BarsSchema = lib.Bars.schema

const MyEnum = new graphql.GraphQLEnumType({
  name: 'MyEnum',
  values: {
    RED: { value: 'red', description: 'red color', deprecationReason: 'hi' },
    GREEN: { value: 'green' }
  }
})

const BazType = new graphql.GraphQLObjectType({
  name: 'Baz',
  fields: {
    id: { type: graphql.GraphQLString },
    name: { type: graphql.GraphQLString },
    my: { type: MyEnum }
  }
})

const BarType = new graphql.GraphQLObjectType({
  name: 'Bar',
  fields: {
    id: { type: graphql.GraphQLString },
    name: { type: graphql.GraphQLString },
    my: { type: MyEnum }
  }
})

const BazInput = new graphql.GraphQLInputObjectType({
  name: 'BazInput',
  fields: {
    a: { type: new graphql.GraphQLList(graphql.GraphQLString), defaultValue: 'a' }
  }
})

const BazInterface = new graphql.GraphQLInterfaceType({
  name: 'BazInterface',
  fields: {
    id: { type: graphql.GraphQLString }
  },
  resolveType () {
    return graphql.GraphQLString
  }
})

const BarInterface = new graphql.GraphQLInterfaceType({
  name: 'BarInterface',
  fields: {
    id: { type: graphql.GraphQLString }
  },
  resolveType () {
    return graphql.GraphQLString
  }
})

const FooUnion = new graphql.GraphQLUnionType({
  name: 'FooUnion',
  types: [BazType, BarType],
  resolveType () {
    return BazType
  }
})

const BazQuery = new graphql.GraphQLObjectType({
  name: 'BazQuery',
  description: 'does baz stuff',
  interfaces: () => [BazInterface, BarInterface],
  fields: {
    id: {
      type: graphql.GraphQLString
    },
    readBaz: {
      type: FooUnion,
      args: {
        query: {
          type: graphql.GraphQLString,
          defaultValue: 'stuff'
        },
        a: {
          type: BazInput
        }
      },
      resolve (source, args, context, info) {
        return { id: 'baz1', name: 'Baz1' }
      },
      _factoryACL: 'read'
    }
  }
})

const BazsSchema = new graphql.GraphQLSchema({
  query: BazQuery
})


//console.log(BazsSchema._queryType._fields.readBaz.type)
/*
_.forEach(BazsSchema._queryType._fields, (v, k) => {
  console.log(k, ':', v)
})
*/
//const def = factory.unmake(BazsSchema, 'Bazs')
const merged = factory.merge(definition, BazsSchema)
//console.log(JSON.stringify(merged.types, null, '  '))

const lib = factory.make(merged, { logger })


