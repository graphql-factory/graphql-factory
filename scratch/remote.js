import { RemoteSchemaHTTP } from '../src/types/remote';
import { SchemaDefinition } from '../src';
import { graphql } from 'graphql';

const remote = new RemoteSchemaHTTP('http://api.graphloc.com/graphql')

new SchemaDefinition()
  .use(remote)
  .use({
    context: {
      db: 'my db'
    },
    types: {
      Foo: {
        type: 'Object',
        fields: {
          name: { type: 'String' }
        }
      },
      Query: {
        type: 'Object',
        fields: {
          readFoo: {
            type: 'Foo',
            resolve () {
              return { name: 'Foo' }
            }
          }
        }
      }
    },
    schema: {
      query: 'Query'
    }
  })
  .buildSchema()
  .then(schema => {
    return schema.request({
      source: `{
        getLocation(ip: "189.59.228.170") {
          country {
            names {
              en
            }
            geoname_id
            iso_code
          }
          location {
            latitude
            longitude
          }
        },
        readFoo {
          name
        }
      }`
    })
  })
  .then(res => {
    console.log(JSON.stringify(res, null, '  '))
  })
  .catch(console.error);
