import _ from 'lodash';
import {
  SchemaDefinition,
} from '../src';
import express from 'express';
import bodyParser from 'body-parser';


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

const schema = new SchemaDefinition()
  .use(definition)
  .buildSchema();

const app = express();
app.use(bodyParser.text());
app.post('/graphql', (req, res) => {
  return schema.request({
    source: req.body
  })
  .then(result => {
    return res.json(result);
  }, err => {
    return res.status(500).send(err.message);
  })
});

app.listen(3000, () => {
  console.log('GraphQL Server Listening on 3000');
})
