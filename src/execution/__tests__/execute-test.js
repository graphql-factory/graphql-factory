import { describe, it } from 'mocha';
import { expect } from 'chai';
import { SchemaDefinition, SchemaBacking } from '../../definition';
import { directives } from '../../directives';
import _ from 'lodash';

const data = {
  foo: [
    { id: '1', name: 'foo1' },
    { id: '2', name: 'foo2' },
    { id: '3', name: 'foo3' }
  ]
};

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

describe('execute tests', function () {
  it('executes a simple query', function () {
    const schema = new SchemaDefinition()
      .use(_.cloneDeep(definition))
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

  it('uses an @resolve directive instead of the resolver', function () {
    console.log('----')
    const backing = new SchemaBacking()
      .Object('Query')
        .resolve('readFoo', () => {
          throw new Error('this should be skipped');
        });

    const def = `
    type Foo {
      id: String!
      name: String!
    }
    type Query {
      readFoo(id: String!): Foo
    }

    schema {
      query: Query
    }
    `;

    const schema = new SchemaDefinition()
      .use(backing.backing)
      .use({
        directives: {
          resolve: directives.resolve
        },
        schema: {
          directives: [ 'resolve' ]
        }
      })
      .use(def)
      .use((source, args, context, info) => {
        return data.foo.filter(({ id }) => id === args.id)[0] || null;
      }, 'readFoo')
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
