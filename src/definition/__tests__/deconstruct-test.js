import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  // GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  buildSchema
} from 'graphql';
import {
  // deconstructDirective,
  deconstructSchema,
  deconstructType,
  processType
} from '../deconstruct';

const fn = () => null;

describe('definition.deconstruct tests', function () {
  it('converts a graphql type to a string', function () {
    const types = {
      nestedArray: new GraphQLList(new GraphQLList(GraphQLString)),
      nestedNull: new GraphQLList(
        new GraphQLNonNull(
          new GraphQLList(
            GraphQLString
          )
        )
      )
    };

    expect(processType(types.nestedArray)).to.equal('[[String]]');
    expect(processType(types.nestedNull)).to.equal('[[String]!]');
  });

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

  it('deconstructs a schema with directives', function () {
    const schema = buildSchema(`
      type Foo @test @test(value: "one"){
        id: ID!
      }
      type Query {
        foo: Foo
      }
      schema {
        query: Query
      }
      directive @test(value: String) on OBJECT
    `);
    const schemaDef = deconstructSchema(schema);
    expect(schemaDef).to.deep.equal({
      types: {
        Query: {
          type: 'Object',
          fields: {
            foo: { type: 'Foo' }
          }
        },
        Foo: {
          type: 'Object',
          fields: {
            id: { type: 'ID!' }
          },
          '@directives': [
            {
              name: 'test',
              args: true
            },
            {
              name: 'test',
              args: {
                value: 'one'
              }
            }
          ]
        }
      },
      schema: {
        query: 'Query',
        directives: [ 'test' ]
      },
      directives: {
        test: {
          locations: [ 'OBJECT' ],
          args: {
            value: { type: 'String' }
          }
        }
      }
    });
  });
  /**
   * TODO: Write tests for
   * 
   * Deconstruct Interface
   * Deconstruct Scalar
   * Deconstruct Enum
   * Deconstruct Union
   * Deconstruct Directive
   * Deconstruct Schema
   */
});
