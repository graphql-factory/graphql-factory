import { RemoteSchemaHTTP } from '../src/remote/schema';
import { SchemaDefinition } from '../src';
import { graphql } from 'graphql';

const remote = new RemoteSchemaHTTP('http://localhost:3000/graphql')

remote.buildSchema().then(remoteSchema => {
  const schema = new SchemaDefinition()
  .use(remoteSchema)
  .buildSchema();

  graphql({
    schema,
    source: `query MyQuery {
      readFoo(id: "1") {
        id
        name
      }
    }`
  })
  .then(res => {
    console.log(res)
  })
})
.catch(console.error)