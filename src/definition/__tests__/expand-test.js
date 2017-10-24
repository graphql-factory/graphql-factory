import { describe, it } from 'mocha'
import { expect } from 'chai'
import Expander from '../expand'

import {
  GraphQLString,
  GraphQLList,
  GraphQLNonNull
} from 'graphql'

describe('definition.expand tests', () => {
  it('expands a typedef with an object field', () => {
    const ex1 = new Expander().expand({
      types: {
        Foo: {
          name: 'Foo',
          fields: {
            str1: { type: GraphQLString },
            str2: GraphQLString,
            str3: 'String',
            str4: new GraphQLList(GraphQLString),
            str5: { type: new GraphQLNonNull(new GraphQLList(GraphQLString))}
          }
        }
      }
    })

    expect(ex1).to.deep.equal({
      types: {
        Foo: {
          type: 'Object',
          name: 'Foo',
          fields: {
            str1: { type: 'String' },
            str2: { type: 'String' },
            str3: { type: 'String' },
            str4: { type: [ 'String' ] },
            str5: { type: [ 'String' ], nullable: false }
          }
        }
      }
    })
  })

  it('expands a schema definition', () => {
    const resolver1 = () => []
    const es1 = new Expander().expand({
      types: {
        Foo: {
          name: 'Foo',
          fields: {
            str1: 'String'
          }
        }
      },
      schemas: {
        Foo: {
          query: {
            name: 'FooQuery',
            fields: {
              listFoo: {
                type: [ 'Foo' ],
                args: {
                  arg1: 'String',
                  arg2: new GraphQLList(GraphQLString)
                },
                resolve: resolver1
              }
            }
          }
        }
      }
    })

    expect(es1).to.deep.equal({
      types: {
        Foo: {
          type: 'Object',
          name: 'Foo',
          fields: {
            str1: { type: 'String' }
          }
        },
        FooQuery: {
          type: 'Object',
          name: 'FooQuery',
          fields: {
            listFoo: {
              type: [ 'Foo' ],
              args: {
                arg1: { type: 'String' },
                arg2: { type: [ 'String' ] }
              },
              resolve: resolver1
            }
          }
        }
      },
      schemas: {
        Foo: {
          query: 'FooQuery'
        }
      }
    })
  })
})
