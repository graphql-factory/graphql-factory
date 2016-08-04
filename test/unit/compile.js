var compile = factory.compile
var utils = factory.utils

describe('Compile', function () {

  /*
   it('', function () {
   var input = {}
   var output = {}
   var result = utils.pick(compile(input), ['types'])
   expect(result).to.deep.equal(output)
   })
   */

  it('Should create basic types in standard factory format', function (done) {
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
            email: { type: 'String' },
            list: ['String']
          }
        }
      }
    }
    var output = {
      types: {
        EnumType: {
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
          type: 'Object',
          fields: {
            id: { type: 'String', primary: true },
            name: { type: 'String', nullable: false },
            email: { type: 'String' },
            list: { type: ['String'] }
          }
        }
      }
    }
    var result = utils.pick(compile(input), ['types'])
    expect(result).to.deep.equal(output)
    done()
  })

  it('Should expand multi-types into separate definitions', function (done) {
    var input = {
      types: {
        User1: {
          type: 'Object',
          fields: { id: { type: 'String' } }
        },
        User2: {
          type: ['Object', 'Input'],
          fields: { id: 'String' }
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
          type: 'Object',
          fields: { id: { type: 'String' } }
        },
        User2: {
          type: 'Object',
          fields: { id: { type: 'String' } }
        },
        User2Input: {
          type: 'Input',
          fields: { id: { type: 'String' } }
        },
        User3: {
          type: 'Object',
          fields: { id: { type: 'String' } }
        },
        User3InputCustomName: {
          type: 'Input',
          fields: { id: { type: 'String' } }
        },
        User4ObjectCustomName: {
          type: 'Object',
          fields: { id: { type: 'String' } }
        },
        User4Input: {
          type: 'Input',
          fields: { id: { type: 'String' } }
        }
      }
    }
    var result = utils.pick(compile(input), ['types'])
    expect(result).to.deep.equal(output)
    done()
  })

  it('Should produce conditional field types', function (done) {
    var input = {
      types: {
        ConditionalField: {
          type: ['Object', 'Input'],
          fields: {
            id: {
              Object: 'Int',
              Input: { type: 'String', nullable: false, args: { arg1: 'String' } }
            }
          }
        }
      }
    }
    var output = {
      types: {
        ConditionalField: {
          type: 'Object',
          fields: { id: { type: 'Int' } }
        },
        ConditionalFieldInput: {
          type: 'Input',
          fields: {
            id: {
              type: 'String',
              nullable: false,
              args: {
                arg1: { type: 'String' }
              }
            }
          }
        }
      }
    }
    var result = utils.pick(compile(input), ['types'])
    expect(result).to.deep.equal(output)
    done()
  })

  it('Should exclude specified fields from types', function (done) {
    var input = {
      types: {
        ExcludeField: {
          type: ['Object', 'Input'],
          fields: {
            id: { type: 'String', primary: true },
            name: { type: 'String', omitFrom: 'Input' },
            email: 'String'
          }
        }
      }
    }
    var output = {
      types: {
        ExcludeField: {
          type: 'Object',
          fields: {
            id: { type: 'String', primary: true },
            name: { type: 'String' },
            email: { type: 'String' }
          }
        },
        ExcludeFieldInput: {
          type: 'Input',
          fields: {
            id: { type: 'String', primary: true },
            email: { type: 'String' }
          }
        }
      }
    }
    var result = utils.pick(compile(input), ['types'])
    expect(result).to.deep.equal(output)
    done()
  })

  it('Should do a basic field extend for 1 or more field bundles', function (done) {
    var input = {
      fields: {
        ExtendableFields1: {
          id: { type: 'String', primary: true },
          field1: 'Boolean'
        },
        ExtendableFields2: {
          field2: 'Int'
        }
      },
      types: {
        ExtendedObject1: {
          extendFields: 'ExtendableFields1',
          fields: { name: 'String' }
        },
        ExtendedObject2: {
          extendFields: ['ExtendableFields1', 'ExtendableFields2'],
          fields: { name: 'String' }
        }
      }
    }
    var output = {
      types: {
        ExtendedObject1: {
          type: 'Object',
          fields: {
            id: { type: 'String', primary: true },
            field1: { type: 'Boolean' },
            name: { type: 'String' }
          }
        },
        ExtendedObject2: {
          type: 'Object',
          fields: {
            id: { type: 'String', primary: true },
            field1: { type: 'Boolean' },
            field2: { type: 'Int' },
            name: { type: 'String' }
          }
        }
      }
    }
    var result = utils.pick(compile(input), ['types'])
    expect(result).to.deep.equal(output)
    done()
  })

  it('Should override extended fields', function (done) {
    var input = {
      fields: {
        ExtendableFields1: {
          id: { type: 'String', primary: true },
          field1: 'Boolean'
        },
        ExtendableFields2: {
          field2: 'Int'
        }
      },
      types: {
        ExtendedObject1: {
          extendFields: {
            ExtendableFields1: {
              field1: { type: 'String' }
            }
          },
          fields: { name: 'String' }
        }
      }
    }
    var output = {
      types: {
        ExtendedObject1: {
          type: 'Object',
          fields: {
            id: { type: 'String', primary: true },
            field1: { type: 'String' },
            name: { type: 'String' }
          }
        }
      }
    }
    var result = utils.pick(compile(input), ['types'])
    expect(result).to.deep.equal(output)
    done()
  })

  it('Should expand fields in a field template', function (done) {
    var input = {
      fields: {
        FieldTemplate: {
          create: {
            type: 'String',
            resolve: 'resolveFunction',
            args: {
              id: { type: 'String', primary: true }
            }
          }
        }
      },
      types: {
        GenericMutation: {
          extendFields: {
            FieldTemplate: {
              create: [
                { name: 'createType1', type: 'Type1' },
                { name: 'createType2', type: 'Type2', args: { type: 'String' } },
                { type: 'Type3' }
              ]
            }
          }
        }
      }
    }
    var output = {
      types: {
        GenericMutation: {
          type: 'Object',
          fields: {
            createType1: {
              type: 'Type1',
              args: {
                id: { type: 'String', primary: true }
              },
              resolve: 'resolveFunction'
            },
            createType2: {
              type: 'Type2',
              args: {
                id: { type: 'String', primary: true },
                type: { type: 'String' }
              },
              resolve: 'resolveFunction'
            },
            create2: {
              type: 'Type3',
              args: {
                id: { type: 'String', primary: true }
              },
              resolve: 'resolveFunction'
            }
          }
        }
      }
    }
    var result = utils.pick(compile(input), ['types'])
    expect(result).to.deep.equal(output)
    done()
  })

  it('Should expand complex extended fields', function (done) {
    var input = {
      fields: {
        AclMutation: {
          create: {
            args: {
              name: { type: 'String', nullable: false },
              description: { type: 'String' }
            },
            resolve: 'CreateRecord'
          }
        }
      },
      types: {
        AccessMutation: {
          extendFields: {
            AclMutation: {
              create: [
                {
                  name: 'createAclResource',
                  type: 'AclResource',
                  _typeName: 'AclResource',
                  args: {
                    type: { type: 'String', nullable: false }
                  }
                },
                { name: 'createAclRole', type: 'AclRole', _typeName: 'AclRole' },
              ]
            }
          }
        }
      }
    }
    var output = {
      types: {
        AccessMutation: {
          type: 'Object',
          fields: {
            createAclResource: {
              type: 'AclResource',
              _typeName: 'AclResource',
              args: {
                name: { type: 'String', nullable: false },
                description: { type: 'String' },
                type: { type: 'String', nullable: false }
              },
              resolve: 'CreateRecord'
            },
            createAclRole: {
              type: 'AclRole',
              _typeName: 'AclRole',
              args: {
                name: { type: 'String', nullable: false },
                description: { type: 'String' }
              },
              resolve: 'CreateRecord'
            }
          }
        }
      }
    }
    var result = utils.pick(compile(input), ['types'])
    expect(result).to.deep.equal(output)
    done()
  })
})