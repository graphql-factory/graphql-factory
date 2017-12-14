import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  // GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList
} from 'graphql';
import {
  // deconstructDirective,
  // deconstructSchema,
  deconstructType
} from '../deconstruct';

const fn = () => null;

describe('deconstruct tests', function () {
  it('deconstructs an Object', function () {
    const Foo = new GraphQLObjectType({
      name: 'Foo',
      description: 'a foo',
      fields: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        name: { type: GraphQLString }
      }
    });

    const Query = new GraphQLObjectType({
      name: 'Query',
      fields: {
        readFoo: {
          type: Foo,
          args: {
            id: {
              type: new GraphQLNonNull(GraphQLString),
              defaultValue: '1'
            },
          },
          resolve: fn
        },
        listFoo: {
          type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Foo))),
          resolve: fn,
          subscribe: fn
        }
      }
    });

    expect(deconstructType(Foo)).to.deep.equal({
      type: 'Object',
      description: 'a foo',
      fields: {
        id: { type: 'String!' },
        name: { type: 'String' }
      }
    });
    expect(deconstructType(Query)).to.deep.equal({
      type: 'Object',
      fields: {
        readFoo: {
          type: 'Foo',
          args: {
            id: {
              type: 'String!',
              defaultValue: '1'
            }
          },
          resolve: fn
        },
        listFoo: {
          type: '[Foo!]!',
          resolve: fn,
          subscribe: fn
        }
      }
    });
  });

  /*
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
            bar: { type: 'String!' },
            baz: { type: '[Int]' }
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
            baz: { type: '[String]' }
          },
          _factory: true
        },
        FooQuery: {
          type: 'Object',
          name: 'FooQuery',
          fields: {
            listFoo: {
              type: '[Foo]',
              args: {
                bar: {
                  type: 'String!',
                  defaultValue: 'bar'
                },
                baz: {
                  type: '[Int]'
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

  it('decomposes an object with a field config thunk map', () => {
    const def1 = new Decomposer().decompose(ObjWithThunk)

    expect(def1).to.deep.equal({
      types: {
        ObjWithThunk: {
          type: 'Object',
          name: 'ObjWithThunk',
          fields: {
            foo: {
              type: 'Foo'
            }
          }
        },
        Foo: FooDef.types.Foo
      }
    })
  })
  */
});
