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
  FooSchema,
  FooEnum,
  listFooResolve
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

  it('decomposes an Enum', () => {
    const def1 = new Decomposer().decompose(FooEnum)

    expect(def1).to.deep.equal({
      types: {
        FooEnum: {
          type: 'Enum',
          name: 'FooEnum',
          values: {
            FOO: { value: 1 },
            BAR: { value: 2 }
          }
        }
      }
    })
  })

  it('decomposes an Input', () => {
    const def1 = new Decomposer().decompose(FooInput)

    expect(def1).to.deep.equal({
      types: {
        FooInput: {
          type: 'Input',
          name: 'FooInput',
          fields: {
            bar: { type: 'String', nullable: false },
            baz: { type: ['Int'] }
          }
        }
      }
    })
  })

  it('decomposes a Schema', () => {
    const def1 = new Decomposer().decompose(FooSchema, 'FooSchema')

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
        },
        FooQuery: {
          type: 'Object',
          name: 'FooQuery',
          fields: {
            listFoo: {
              type: ['Foo'],
              args: {
                bar: {
                  type: 'String',
                  nullable: false,
                  defaultValue: 'bar'
                },
                baz: {
                  type: ['Int']
                }
              },
              resolve: listFooResolve
            }
          }
        }
      },
      schemas: {
        FooSchema: {
          query: 'FooQuery'
        }
      }
    })
  })
})