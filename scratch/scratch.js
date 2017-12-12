import _ from 'lodash';
import {
  SchemaDefinition,
  getFieldDirectives,
  getSchemaDirectives,
  getOperationDirectives,
  FactoryEvents,
  directives
} from '../src';
import {
  DirectiveLocation,
  introspectionQuery,
  buildClientSchema,
  printSchema
} from 'graphql';

import {
  makePath
} from '../src/utilities/info';


function getIntrospectionQuery(options?: IntrospectionOptions): string {
  const descriptions = !(options && options.descriptions === false);
  return `
    query IntrospectionQuery {
      __schema {
        queryType { name }
        mutationType { name }
        subscriptionType { name }
        types {
          ...FullType
        }
        directives {
          name
          ${descriptions ? 'description' : ''}
          locations
          args {
            ...InputValue
          }
        },
        astNode
      }
    }
    fragment FullType on __Type {
      kind
      name
      ${descriptions ? 'description' : ''}
      fields(includeDeprecated: true) {
        name
        ${descriptions ? 'description' : ''}
        args {
          ...InputValue
        }
        type {
          ...TypeRef
        }
        isDeprecated
        deprecationReason
      }
      inputFields {
        ...InputValue
      }
      interfaces {
        ...TypeRef
      }
      enumValues(includeDeprecated: true) {
        name
        ${descriptions ? 'description' : ''}
        isDeprecated
        deprecationReason
      }
      possibleTypes {
        ...TypeRef
      }
    }
    fragment InputValue on __InputValue {
      name
      ${descriptions ? 'description' : ''}
      type { ...TypeRef }
      defaultValue
    }
    fragment TypeRef on __Type {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
}


const db = {
  foo: [
    { id: '1', name: 'Foo1' },
    { id: '2', name: 'Foo2' }
  ]
}

const definition = {
  directives: {
    permission: {
      locations: [
        DirectiveLocation.OBJECT,
        DirectiveLocation.SCHEMA,
        DirectiveLocation.FIELD_DEFINITION
      ],
      args: {
        user: { type: 'JSON' },
        filter: { type: 'JSON' },
        query: { type: 'String' }
      },
      resolve(source, args, context, info) {
        console.log(info.location, args)
      },
      resolveResult(source, args, context, info) {

      }
    },
    test: {
      locations: _.values(DirectiveLocation),
      args: {
        value: { type: 'String' }
      },
      resolve(source, args, context, info) {
        // console.log(args)
        // console.log(getOperationDirectives(info))
        // info.fieldInfo.args.id = 2;
        // console.log(info);
      }
    }
  },
  types: {
    Foo: {
      type: 'Object',
      fields: {
        id: 'String!',
        name: 'String'
      },
      '@directives': {
        permission: {
          query: '{ \"user\": { \"id\": { \"$exists\": true } }, \"role\": { \"$in\": [\"ADMIN\"] } }'
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
              type: 'String!',
              '@directives': {
                validate: { validator: 'isMatch' }
              }
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
    '@directives': {
      test: {
        value: ''
      }
    },
    directives: [ 'test', 'permission', 'validate' ],
    query: 'Query'
  }
};

const schema = new SchemaDefinition()
  .use(definition)
  .use({
    types: {
      Query: {
        type: 'Object',
        fields: {
          listFoo: {
            type: '[Foo]',
            resolve(source, args, context, info) {
              return db.foo
            }
          }
        }
      }
    }
  })
  .use({ context: { test: true } })
  .use({ context: { foo: false } })
  .use(value => {
    return value.match(/^\d+$/) !== null
  }, 'isMatch')
  .use({ directives })
  //.on(FactoryEvents.EXECUTION, console.log)
  .buildSchema();



let source = `query MyQuery {
  readFoo(id: "1") @test(value: "query") {
    id
    name
  }
}`

source = getIntrospectionQuery()


schema.request({
  source
})
.then(intro => {
  console.log(intro.data)
  const s = buildClientSchema(intro.data)
  console.log(printSchema(s))
})
.catch(console.error)
