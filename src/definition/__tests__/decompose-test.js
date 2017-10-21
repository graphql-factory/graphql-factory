import { describe, it } from 'mocha'
import { expect } from 'chai'

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

import {
  Foo,
  FooInput,
  FooQuery,
  FooSchema,
  FooEnum
} from './objects'

import Decomposer from '../decompose'

describe('decompose test', () => {
  it('decomposes an Object', () => {
    const def1 = new Decomposer().decompose(Foo)

    expect(def1).to.deep.equal({
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
    })
  })
})