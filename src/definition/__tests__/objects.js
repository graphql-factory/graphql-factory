import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull
} from 'graphql'

export const FooEnum = new GraphQLEnumType({
  name: 'FooEnum',
  values: {
    FOO: { value: 1 },
    BAR: { value: 2 }
  }
})

export const Foo = new GraphQLObjectType({
  name: 'Foo',
  fields: {
    bar: { type: GraphQLString },
    baz: { type: new GraphQLList(GraphQLString) }
  },
  _factory: true
})

export const FooInput = new GraphQLInputObjectType({
  name: 'FooInput',
  fields: {
    bar: { type: new GraphQLNonNull(GraphQLString) },
    baz: { type: new GraphQLList(GraphQLInt) }
  }
})

export function listFooResolve () {
  return [
    { bar: 'bar', baz: ['1', '2'] },
    { bar: 'baz', baz: ['3', '4'] }
  ]
}

export const FooQuery = new GraphQLObjectType({
  name: 'FooQuery',
  fields: {
    listFoo: {
      type: new GraphQLList(Foo),
      args: {
        bar: {
          type: new GraphQLNonNull(GraphQLString),
          defaultValue: 'bar'
        },
        baz: {
          type: new GraphQLList(GraphQLInt)
        }
      },
      resolve: listFooResolve
    }
  }
})

export const FooSchema = new GraphQLSchema({
  query: FooQuery
})
