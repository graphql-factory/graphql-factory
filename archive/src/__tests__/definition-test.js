/* eslint-disable */
import { describe, it } from 'mocha'
import { expect } from 'chai'
import Definition from '../definition/definition'
import EventEmitter from 'events'
import { graphql, DirectiveLocation, GraphQLString } from 'graphql'
import * as tools from '../common/tools'
import _ from 'lodash'

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
        DirectiveLocation.FIELD,
        DirectiveLocation.SCHEMA
      ],
      args: {
        collection: {
          type: GraphQLString
        }
      }
    },
    log: {
      name: 'log',
      description: 'simple logger on middleware',
      locations: _.values(DirectiveLocation),
      args: {
        at: 'String'
      },
      beforeResolve (req, res, next) {
        const { info } = req
        console.log('log middleware', info)
        return next()
      }
    }
  },
  types: {
    List: {
      '@log': { at: 'List object def' },
      fields: {
        id: 'ID!',
        name: 'String!'
      }
    },
    User: {
      '@log': { at: 'User object def' },
      fields: {
        id: 'ID!',
        name: 'String!',
        lists: {
          '@log': { at: 'user lists field' },
          type: '[List]',
          args: {
            a: {
              type: 'String'
            }
          },
          resolve (source, args, context, info) {
            // console.log(tools.mapDirectives(info))
            return [
              { id: 'list-1', name: 'Shopping' },
              { id: 'list-2', name: 'Christmas' }
            ]
          }
        }
      }
    }
  },
  schemas: {
    Users: {
      '@log': { at: 'Users Schema' },
      directives: ['log', 'model'],
      query: {
        '@model': true,
        '@log': { at: 'rootQuery'},
        fields: {
          readUser: {
            '@log': { at: 'readUserField' },
            type: 'User',
            args: {
              userFilter: {
                type: 'String',
                '@log': { at: 'userFilter' }
              }
            },
            resolve (source, args, context, info) {
              // console.log({ parentType: info.parentType })
              return {
                id: '1',
                name: 'John'
              }
            }
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

    // console.log(def.schemas.Users.export(def).document)

    const reg = def.build()

    // console.log(reg.Users)

    return graphql(reg.Users, `
      query Query @log(at: "query") {
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
        // console.log(JSON.stringify(result, null, '  '))
        // console.log(result)
        return result
      }, console.error)

      // expect(true).to.equal(true)
  })
})
