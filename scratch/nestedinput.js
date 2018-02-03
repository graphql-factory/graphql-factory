import { SchemaDefinition, directives, printDefinition } from '../src';
import { DirectiveLocation } from 'graphql';

const definition = new SchemaDefinition()
  .use(`
  enum Animal {
    DOG @enum(value: 0)
    CAT @enum(value: 1)
  }
  `)
  .use({
    directives: {
      enum: directives.enum,
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
      /*
      Animal: {
        type: 'Enum',
        values: {
          DOG: { value: 1 },
          CAT: { value: 2 }
        }
      },
      */
      Foo: {
        type: 'Object',
        fields: {
          id: { type: 'ID!' },
          name: { type: 'String!' }
        }
      },
      BarInput: {
        type: 'Input',
        fields: {
          foo: {
            type: 'FooInput',
            '@directives': {
              test: {
                value: 'bar input name'
              }
            }
          }
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
                value: 'foo input name'
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
            resolve (source, args) {
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
              animal: { type: '[Animal]' },
              basic: { type: 'String' },
              bar: {
                type: 'BarInput'
              },
              data: {
                type: 'FooInput',
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
              console.log({ args })
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
    // console.log(printDefinition(schema.definition))
    return schema.request({
      extensionData: true,
      source: `mutation M {
        setFoo(
          # animal: [ CAT, DOG ]
          # basic: "hi",
          # data: { id: "asdf", name: "foooooo" },
          # datas: [
          #  { id: "jkl", name: "bar" },
          #  { id: "xyz", name: "baz" }
          # ]
          bar: {
            foo: {
              id: "fooid",
              name: "fooname"
            }
          }
        ) {
          id
          name
        }
      }`
    });
  })
  .then(console.log)
  .catch(console.error)
