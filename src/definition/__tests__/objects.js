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

export const FooDef = {
  types: {
    Foo: {
      type: 'Object',
      name: 'Foo',
      fields: {
        bar: { type: 'String' },
        baz: { type: ['String'] }
      },
      _factory: true
    }
  }
}

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

export const EntityType = new GraphQLInterfaceType({
  name: 'Entity',
  description: 'Entity Description',
  fields: {
    name: {
      type: GraphQLString
    }
  }
})

export const DogType = new GraphQLObjectType({
  name: 'Dog',
  fields: {
    name: { type: GraphQLString },
    dog: { type: GraphQLString }
  }
})

export const CatType = new GraphQLObjectType({
  name: 'Cat',
  fields: {
    name: { type: GraphQLString },
    cat: { type: GraphQLString }
  }
})

export function resolvePetType (value) {
  if (value instanceof Dog) {
    return DogType;
  }
  if (value instanceof Cat) {
    return CatType;
  }
}

export const PetType = new GraphQLUnionType({
  name: 'Pet',
  types: [ DogType, CatType ],
  resolveType: resolvePetType
})

export function oddParseLiteral (ast) {
  if (ast.kind === Kind.INT) {
    const value = ast.value
    return value % 2 === 1 ? value : null
  }
  return null
}

export function oddValue (value) {
  return value % 2 === 1 ? value : null
}

export const OddType = new GraphQLScalarType({
  name: 'Odd',
  serialize: oddValue,
  parseValue: oddValue,
  parseLiteral: oddParseLiteral
})