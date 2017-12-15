import { describe, it } from 'mocha';
import { expect } from 'chai';
import { SchemaDefinition } from '../../definition';
import { printDefinition } from '../printer';
import { DirectiveLocation, buildSchema } from 'graphql';

describe('printer tests', function () {
  it('print a schema', function () {
    const def = new SchemaDefinition({
      noDefaultTypes: true
    })
      .use({
        types: {
          Foo: {
            type: 'Object',
            description: 'foo type',
            fields: {
              id: {
                type: 'String!',
                description: 'id field',
                '@directives': {
                  test: {
                    value: false
                  },
                  id: {}
                }
              },
              bar: { type: 'String' }
            },
            '@directives': {
              test: {
                value: true
              }
            }
          },
          Query: {
            type: 'Object',
            fields: {
              readFoo: {
                type: 'Foo',
                args: {
                  id: {
                    type: 'String!'
                  }
                }
              }
            }
          }
        },
        directives: {
          test: {
            description: 'test directive',
            locations: [
              DirectiveLocation.OBJECT
            ],
            args: {
              value: { type: 'Boolean' }
            }
          },
          id: {
            locations: [
              DirectiveLocation.FIELD_DEFINITION
            ]
          }
        },
        schema: {
          directives: [ 'test' ],
          query: 'Query'
        }
      });
      const str = printDefinition(def);
      buildSchema(str);

      expect(str).to.equal(`# foo type
type Foo @test(value: true) {
  # id field
  id: String! @test(value: false) @id
  bar: String
}

type Query {
  readFoo(
    id: String!
  ): Foo
}

# test directive
directive @test(
  value: Boolean
) on OBJECT

directive @id on FIELD_DEFINITION

schema {
  query: Query
}
`);
  });
});
