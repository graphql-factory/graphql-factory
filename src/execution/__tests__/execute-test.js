import { describe, it } from 'mocha';
import { expect } from 'chai';
import { SchemaDefinition } from '../../definition';
import { directives } from '../../directives';
import _ from 'lodash';

const data = Object.freeze({
  foo: [
    { id: '1', name: 'foo1' },
    { id: '2', name: 'foo2' },
    { id: '3', name: 'foo3' },
  ],
  bar: [
    { id: '1', name: 'bar1', foo: '3' },
    { id: '2', name: 'bar2', foo: '2' },
    { id: '3', name: 'bar3', foo: '1' },
  ],
});

const definition = {
  types: {
    Foo: {
      type: 'Object',
      fields: {
        id: { type: 'String!' },
        name: { type: 'String!' },
      },
    },
    Bar: {
      type: 'Object',
      fields: {
        id: { type: 'String!' },
        name: { type: 'String!' },
        foo: {
          type: 'Foo',
          resolve(source) {
            return _.find(data.foo, { id: source.foo }) || null;
          },
        },
      },
    },
    Query: {
      type: 'Object',
      fields: {
        readFoo: {
          type: 'Foo',
          args: {
            id: { type: 'String!' },
          },
          resolve(source, args) {
            return data.foo.filter(({ id }) => id === args.id)[0] || null;
          },
        },
        readBar: {
          type: 'Bar',
          args: {
            id: { type: 'String!' },
          },
          resolve(source, args) {
            return data.bar.filter(({ id }) => id === args.id)[0] || null;
          },
        },
      },
    },
  },
  schema: {
    query: 'Query',
  },
};

describe('execute tests', function() {
  it('executes a simple query', async function() {
    const schema = await new SchemaDefinition()
      .use(_.cloneDeep(definition))
      .buildSchema();

    return schema
      .request({
        extensionData: false,
        source: `query MyQuery {
        readFoo(id: "1") {
          id
          name
        }
      }`,
      })
      .then(result => {
        expect(result).to.deep.equal({
          data: {
            readFoo: {
              id: '1',
              name: 'foo1',
            },
          },
        });
      });
  });

  it('executes a nested query', async function() {
    const schema = await new SchemaDefinition()
      .use(_.cloneDeep(definition))
      .buildSchema();

    return schema
      .request({
        extensionData: false,
        source: `query MyQuery {
        readBar(id: "1") {
          id
          name
          foo {
            id
            name
          }
        }
      }`,
      })
      .then(result => {
        expect(result).to.deep.equal({
          data: {
            readBar: {
              id: '1',
              name: 'bar1',
              foo: {
                id: '3',
                name: 'foo3',
              },
            },
          },
        });
      });
  });

  it('executes a nested query with alias', async function() {
    const schema = await new SchemaDefinition()
      .use(_.cloneDeep(definition))
      .buildSchema();

    return schema
      .request({
        extensionData: false,
        source: `query MyQuery2 {
        readBar(id: "1") {
          id
          name
          qux:foo {
            id
            name
          }
        }
      }`,
      })
      .then(result => {
        expect(result).to.deep.equal({
          data: {
            readBar: {
              id: '1',
              name: 'bar1',
              qux: {
                id: '3',
                name: 'foo3',
              },
            },
          },
        });
      });
  });

  it('uses an @resolve directive instead of the resolver', async function() {
    const def = `
    type Foo {
      id: String!
      name: String!
    }
    type Query {
      readFoo(id: String!): Foo @resolve(resolver: "readFoo")
    }

    schema {
      query: Query
    }
    `;

    const schema = await new SchemaDefinition()
      .use({
        directives: {
          resolve: directives.resolve,
        },
        schema: {
          directives: ['resolve'],
        },
      })
      .use(def)
      .use((source, args) => {
        return data.foo.filter(({ id }) => id === args.id)[0] || null;
      }, 'readFoo')
      .buildSchema();

    return schema
      .request({
        extensionData: false,
        source: `query MyQuery {
        readFoo(id: "1") {
          id
          name
        }
      }`,
      })
      .then(result => {
        expect(result).to.deep.equal({
          data: {
            readFoo: {
              id: '1',
              name: 'foo1',
            },
          },
        });
      });
  });
});
