/* eslint-disable */
import { describe, it } from 'mocha'
import { expect } from 'chai'
import Definition from '../definition/definition'
import EventEmitter from 'events'
import { graphql, DirectiveLocation } from 'graphql'
import * as tools from '../common/tools'

const factory = new EventEmitter()

const def1 = `
type User @model {
  id: ID! @isUnique
  stories: [Story!]! @relation(name: "UserOnStory")
}
type Story @model {
  id: ID! @isUnique
  text: String! @custom(stuff: { is: "cool" } blah: 1) @custom(cool: "hi")
  author: User! @relation(name: "UserOnStory")
}

type Query {
  list: Story
}

schema {
  query: Query
}
`

const def2 = {
  schemas: {
    Foo: {
      query: {
        name: 'FooQuery',
        fields: {
          readFoo: {
            type: 'Foo',
            resolve () {}
          }
        }
      }
    }
  },
  types: {
    USER_STATE: {
      type: 'Enum',
      values: {
        NOT_FOUND: 'NOT_FOUND',
        ACTIVE: { description: 'Its alive' },
        INACTIVE: { deprecationReason: 'who cares' },
        SUSPENDED: undefined
      }
    },
    FooIface: {
      type: 'Interface',
      fields: {
        id: 'String',
        bar: {
          type: 'Int',
          directives: {
            model: {
              is: 1
            }
          }
        }
      }
    },
    FooScalar: {
      type: 'Scalar',
      serialize () {

      }
    },
    FooUnion: {
      type: 'Union',
      types: ['FooInput', 'FooIface'],
      description: 'A union foo',
      directives: {
        stuff: {
          is: 'cool'
        }
      }
    },
    FooInput: {
      type: 'Input',
      fields: {
        id: 'String',
        bar: {
          type: 'Int',
          directives: {
            model: {
              is: 1
            }
          }
        }
      },
      directives: {
        foo: { str: 'bar' }
      }
    },
    Foo: {
      fields: {
        id: {
          type: 'ID!',
          directives: {
            isUnique: ''
          }
        },
        short: 'String',
        text: {
          type: 'String',
          description: 'Some text',
          deprecationReason: 'i dont like it',
          args: {
            stuff: {
              type: 'String',
              defaultValue: 'ok',
              description: 'this is stuff'
            },
            bar: '[Int]!'
          },
          resolve () {

          },
          directives: {
            model: {
              a: {
                b: true,
                c: false
              }
            }
          }
        }
      }
    }
  }
}

const userDef = {
  directives: {
    model: {
      name: 'model',
      description: 'a model directive',
      locations: [
        DirectiveLocation.FIELD
      ],
      args: {
        ok: {
          type: 'String',
          defaultValue: 'yes'
        }
      },
      before () {

      },
      after () {

      },
      error () {

      }
    }
  },
  types: {
    List: {
      fields: {
        id: 'ID!',
        name: 'String!'
      }
    },
    User: {
      fields: {
        id: 'ID!',
        name: 'String!',
        lists: {
          type: '[List]',
          args: {
            a: {
              type: 'String',
              '@argDirective': ''
            }
          },
          resolve (source, args, context, info) {
            console.log(tools.mapDirectives(info))
            return [
              { id: 'list-1', name: 'Shopping' },
              { id: 'list-2', name: 'Christmas' }
            ]
          },
          '@listsDirective': {
            value: true
          }
        }
      },
      '@userDirective': ''
    }
  },
  schemas: {
    Users: {
      query: {
        fields: {
          readUser: {
            type: 'User',
            resolve (source, args, context, info) {
              // console.log({ parentType: info.parentType })
              return {
                id: '1',
                name: 'John'
              }
            },
            '@readUserDirective': ''
          }
        }
      },
      '@schemaDirective': {
        stuff: 'is cool',
        not: {
          arr: [ 1, true ],
          to: {
            lower: 1
          }
        }
      }
    }
  }
}

describe('definition tests', () => {
  it('creates defintion from schema language', () => {
    const def = new Definition(factory)
      .use(userDef)

    console.log(def.directives)

    const reg = def.build()

    return graphql(reg.Users, `
      query Query {
        readUser {
          id
          name
          lists {
            id
            name
          }
        }
      }
    `)
      .then(result => {
        console.log(JSON.stringify(result, null, '  '))
        return result
      })

      // expect(true).to.equal(true)
  })
})
