import { SchemaDefinition } from '../src';
import { DirectiveLocation } from 'graphql';

new SchemaDefinition()
    .use({
      directives: {
        test: {
          name: 'test',
          locations: Object.keys(DirectiveLocation).map(k => DirectiveLocation[k]),
          args: {
            value: { type: 'JSON' }
          },
          resolve(source, args, context, info) {
            // console.log('TEST', { source, args })
          }
        }
      },
      types: {
        Foo: {
          type: 'Object',
          fields: {
            id: { type: 'ID!' },
            name: { type: 'String!' }
          }
        },
        FooInput: {
          type: 'Input',
          fields: {
            id: { type: 'ID!' },
            name: {
              type: 'String!',
              '@directives': {
                test: {
                  value: 'input name'
                }
              }
            }
          }
        },
        Query: {
          type: 'Object',
          fields: {
            foo: {
              type: 'Foo',
              resolve () {
                return { id: 'asffjkl', name: 'foo' }
              }
            }
          }
        },
        Mutation: {
          type: 'Object',
          fields: {
            setFoo: {
              type: 'Foo',
              args: {
                data: {
                  type: 'FooInput!',
                  '@directives': {
                    test: {
                      value: 'data args'
                    }
                  }
                },
                datas: {
                  type: '[FooInput]'
                }
              },
              resolve (source, args, context, info) {
                return args.data
              }
            }
          }
        }
      },
      schema: {
        query: 'Query',
        mutation: 'Mutation'
      }
    })
    .buildSchema()
    .then(schema => {
      return schema.request({
        extensionData: false,
        source: `mutation M {
          setFoo(
            data: { id: "asdf", name: "foooooo" },
            datas: [
              { id: "jkl", name: "bar" }
            ]
          ) {
            id
            name
          }
        }`
      });
    })
    .then(console.log)
    .catch(console.error)