var compile = factory.compile
var utils = factory.utils

describe('Compile', function () {

  /*
   it('', function () {
   var input = {}
   var output = {}
   var result = utils.pick(compile(input), ['types', 'schemas'])
   expect(result).to.deep.equal(output)
   })
   */

  it('Should create basic types in standard factory format', function () {
    var input = {
      types: {
        EnumType: {
          type: 'Enum',
          values: {
            DOG: 'DOG',
            CAT: 'CAT',
            ONE: 1,
            TWO: { value: 2 },
            DODO: {
              name: 'DODO',
              value: 'DODO',
              deprecationReason: 'extinct',
              description: 'An extinct bird'
            }
          }
        },
        ObjectType: {
          fields: {
            id: { type: 'String', primary: true },
            name: { type: 'String', nullable: false },
            email: { type: 'String' }
          }
        }
      }
    }
    var output = {
      types: {
        EnumType: {
          _typeDef: input.types.EnumType,
          type: 'Enum',
          values: {
            DOG: { value: 'DOG' },
            CAT: { value: 'CAT' },
            ONE: { value: 1 },
            TWO: { value: 2 },
            DODO: {
              name: 'DODO',
              value: 'DODO',
              deprecationReason: 'extinct',
              description: 'An extinct bird'
            }
          }
        },
        ObjectType: {
          _typeDef: input.types.ObjectType,
          type: 'Object',
          fields: {
            id: { type: 'String', primary: true },
            name: { type: 'String', nullable: false },
            email: { type: 'String' }
          }
        }
      }
    }
    var result = utils.pick(compile(input), ['types'])
    expect(result).to.deep.equal(output)
  })

  it('Should expand multi-types into separate definitions', function () {
    var input = {
      types: {
        User1: {
          type: 'Object',
          fields: { id: { type: 'String' } }
        },
        User2: {
          type: ['Object', 'Input'],
          fields: { id: { type: 'String' } }
        },
        User3: {
          type: ['Object', { Input: 'User3InputCustomName' }],
          fields: { id: { type: 'String' } }
        },
        User4: {
          type: { Object: 'User4ObjectCustomName', Input: null },
          fields: { id: { type: 'String' } }
        }
      }
    }
    var output = {
      types: {
        User1: {
          _typeDef: input.types.User1,
          type: 'Object',
          fields: { id: { type: 'String' } }
        },
        User2: {
          _typeDef: input.types.User2,
          type: 'Object',
          fields: { id: { type: 'String' } }
        },
        User2Input: {
          _typeDef: input.types.User2,
          type: 'Input',
          fields: { id: { type: 'String' } }
        },
        User3: {
          _typeDef: input.types.User3,
          type: 'Object',
          fields: { id: { type: 'String' } }
        },
        User3InputCustomName: {
          _typeDef: input.types.User3,
          type: 'Input',
          fields: { id: { type: 'String' } }
        },
        User4ObjectCustomName: {
          _typeDef: input.types.User4,
          type: 'Object',
          fields: { id: { type: 'String' } }
        },
        User4Input: {
          _typeDef: input.types.User4,
          type: 'Input',
          fields: { id: { type: 'String' } }
        }
      }
    }
    var result = utils.pick(compile(input), ['types'])
    // console.log(JSON.stringify(result, null, '  '))
    expect(result).to.deep.equal(output)
  })
})