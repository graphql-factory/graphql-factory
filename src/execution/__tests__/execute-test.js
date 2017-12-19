import { describe, it } from 'mocha';
import { expect } from 'chai';
import { SchemaDefinition } from '../../definition';

const data = {
  foo: [
    { id: '1', name: 'foo1' },
    { id: '2', name: 'foo2' },
    { id: '3', name: 'foo3' }
  ]
};

describe('execute tests', function () {
  it('executes a simple query', function () {
    const definition = {
      types: {
        Foo: {
          type: 'Object',
          fields: {
            id: { type: 'String!' },
            name: { type: 'String!' }
          }
        },
        Query: {
          type: 'Object',
          fields: {
            readFoo: {
              type: 'Foo',
              args: {
                id: { type: 'String!' }
              },
              resolve(source, args) {
                return data.foo.filter(({ id }) => id === args.id)[0] || null;
              }
            }
          }
        }
      },
      schema: {
        query: 'Query'
      }
    };
    const schema = new SchemaDefinition()
      .use(definition)
      .buildSchema();

    return schema.request({
      source: `query MyQuery {
        readFoo(id: "1") {
          id
          name
        }
      }`
    })
    .then(result => {
      expect(result).to.deep.equal({
        data: {
          readFoo: {
            id: '1',
            name: 'foo1'
          }
        }
      });
    });
  });
});
