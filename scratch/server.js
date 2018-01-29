import _ from 'lodash';
import { SchemaDefinition, RemoteSchemaHTTP } from '../src';
import express from 'express';
import graphqlHTTP from 'express-graphql';
import bodyParser from 'body-parser';

const remote = new RemoteSchemaHTTP('http://api.graphloc.com/graphql')


const db = {
  foo: [
    { id: '1', name: 'Foo1' },
    { id: '2', name: 'Foo2' }
  ]
}

const definition = {
  context: {
    db: 'MyDB'
  },
  types: {
    Foo: {
      type: 'Object',
      fields: {
        id: 'String!',
        name: 'String'
      },
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
          },
          resolve(source, args, context, info) {
            console.log(context.headers, context.db)
            return _.find(db.foo, { id: args.id });
          }
        }
      }
    }
  },
  schema: {
    query: 'Query'
  }
};

new SchemaDefinition()
  .use(remote)
  .use(definition)
  .buildSchema()
  .then(schema => {
    const app = express();
    app.use('/graphql', graphqlHTTP({
      schema
    }));
    
    app.listen(3000, () => {
      console.log('GraphQL Server Listening on 3000');
    })
  });
