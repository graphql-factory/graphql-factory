import _ from 'lodash';
import {
  SchemaDefinition
} from '../src';
import {
  DirectiveLocation
} from 'graphql';

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
  directives: {
    test: {
      locations: [
        DirectiveLocation.QUERY,
        DirectiveLocation.FIELD
      ],
      args: {
        value: { type: 'String' }
      },
      resolve(source, args, context, info) {
        info.fieldInfo.args.id= 100;
        console.log(info.fieldInfo.args)
        // info.fieldInfo.args.id = 2;
        // console.log(info);
      }
    }
  },
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
            console.log({args})
            return _.find(db.foo, { id: args.id });
          }
        }
      }
    }
  },
  schema: {
    directives: [ 'test' ],
    query: 'Query'
  }
};

const schema = new SchemaDefinition()
  .use(definition)
  .buildSchema();

schema.request({
  source: `query MyQuery {
    readFoo(id: "1") @test(value: "query") {
      id
      name
    }
  }`
})
.then(console.log)
.catch(console.error)