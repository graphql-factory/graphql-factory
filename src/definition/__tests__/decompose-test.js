import { describe, it } from 'mocha'
import { expect } from 'chai'

import {
  Foo,
  FooDef,
  FooInput,
  FooSchema,
  FooEnum,
  EntityType,
  PetType,
  OddType,
  listFooResolve,
  resolvePetType,
  oddParseLiteral,
  oddValue
} from './objects'

import Decomposer from '../decompose'

describe('decompose tests', () => {
  it('decomposes an Object', () => {
    const def1 = new Decomposer().decompose(Foo)

    expect(def1).to.deep.equal(FooDef)
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

  it('decomposes an interface', () => {
    const def1 = new Decomposer().decompose(EntityType)

    expect(def1).to.deep.equal({
      types: {
        Entity: {
          type: 'Interface',
          name: 'Entity',
          description: 'Entity Description',
          fields: {
            name: {
              type: 'String'
            }
          }
        }
      }
    })
  })

  it('decomposes a Union', () => {
    const def1 = new Decomposer().decompose(PetType)

    expect(def1).to.deep.equal({
      types: {
        Cat: {
          type: 'Object',
          name: 'Cat',
          fields: {
            name: { type: 'String' },
            cat: { type: 'String' }
          }
        },
        Dog: {
          type: 'Object',
          name: 'Dog',
          fields: {
            name: { type: 'String' },
            dog: { type: 'String' }
          }
        },
        Pet: {
          type: 'Union',
          name: 'Pet',
          types: [ 'Dog', 'Cat' ],
          resolveType: resolvePetType
        }
      }
    })
  })

  it('decomposes a Scalar', () => {
    const def1 = new Decomposer().decompose(OddType)

    expect(def1).to.deep.equal({
      types: {
        Odd: {
          type: 'Scalar',
          name: 'Odd',
          serialize: oddValue,
          parseValue: oddValue,
          parseLiteral: oddParseLiteral
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