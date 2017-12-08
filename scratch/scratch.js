import _ from 'lodash';
import {
  SchemaDefinition
} from '../src';

import {
  makePath
} from '../src/utilities/info';

const db = {
  foo: [
    { id: '1', name: 'Foo1' },
    { id: '2', name: 'Foo2' }
  ]
}

const definition = {
  types: {
    Foo: {
      type: 'Object',
      fields: {
        id: { type: 'String!' },
        name: { type: 'String' }
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
          resolve(source, args, context, info) {
            return _.find(db.foo, args);
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

schema.request({
  source: `query MyQuery {
    readFoo(id: "1") {
      id
      name
    }
  }`
})
.then(console.log)
.catch(console.error)