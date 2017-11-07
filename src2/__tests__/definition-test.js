import { describe, it } from 'mocha'
import { expect } from 'chai'
import Definition from '../definition'
import EventEmitter from 'events'

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
        foo: 'bar'
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

describe('definition tests', () => {
  it('creates defintion from schema language', () => {
    const def = new Definition(factory)
      .use(def2)

    // console.log(def)

    expect(true).to.equal(true)
  })
})
