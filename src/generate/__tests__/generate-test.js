import _ from '../../common/lodash.custom'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import * as graphql from 'graphql'
import Generator from '../generate'
import Definition from '../../definition/definition'

const {
  GraphQLEnumType,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLList
} = graphql

const FooEnumDef = {
  type: 'Enum',
  name: 'FooEnum',
  values: {
    VAL1: { value: 1 },
    VAL2: { value: 2 }
  },
  description: 'Foo Enum'
}

const FooEnum = new GraphQLEnumType(FooEnumDef)

const FooObjectDef = {
  type: 'Object',
  name: 'FooObject',
  fields: {
    field1: {
      type: GraphQLString
    }
  }
}

const FooObject = new GraphQLObjectType(FooObjectDef)

/*
const BarObjectDef = {
  type: 'Object',
  name: 'BarObject',
  fields: {
    field1: {
      type: GraphQLInt
    }
  }
}

const BarObject = new GraphQLObjectType(BarObjectDef)


const BazObjectDef = {
  type: 'Object',
  name: 'BazObject',
  fields: {
    field1: {
      type: new GraphQLNonNull(GraphQLString)
    }
  }
}

const BazObject = new GraphQLObjectType(BazObjectDef)
*/
const FooInputDef = {
  type: 'Input',
  name: 'FooInput',
  fields: {
    field1: {
      type: new GraphQLList(GraphQLString)
    }
  }
}

const FooInput = new GraphQLInputObjectType(FooInputDef)

const FooInterface1Def = {
  type: 'Interface',
  name: 'FooInterface1',
  fields: {
    field1: {
      type: new GraphQLList(GraphQLInt)
    }
  }
}

const FooInterface1 = new GraphQLInterfaceType(FooInterface1Def)

/*
const FooInterface2Def = {
  type: 'Interface',
  name: 'FooInterface2',
  fields: {
    field1: {
      type: new GraphQLList(GraphQLString)
    }
  }
}

const FooInterface2 = new GraphQLInterfaceType(FooInterface2Def)
*/

const FooUnionDef = {
  type: 'Union',
  name: 'FooUnion',
  types: [ 'FooObject', 'BarObject', 'BazObject' ]
}

const FooUnion = new GraphQLUnionType(FooUnionDef)

const FooScalarDef = {
  type: 'Scalar',
  name: 'FooScalar',
  serialize () {
    return 1
  }
}

const FooScalar = new GraphQLScalarType(FooScalarDef)

const FooSchemaQuery = new GraphQLObjectType({
  name: 'FooSchemaQuery',
  fields: {
    foo: {
      type: GraphQLString,
      args: {
        arg1: { type: GraphQLString }
      },
      resolve () {
        return 'result'
      }
    }
  }
})

const FooSchemaDef = {
  query: FooSchemaQuery
}

/*
 * Start tests
 */
describe('generate.generate tests', () => {
  it('generates an Enum', () => {
    const reg = new Generator(graphql).generate(
      new Definition().use({
        types: {
          FooEnum: FooEnumDef
        }
      })
    )

    expect(reg.types.FooEnum).to.deep.equal(FooEnum)
  })

  it('generates an Object', () => {
    const reg = new Generator(graphql).generate(
      new Definition().use({
        types: {
          FooObject: FooObjectDef
        }
      })
    )

    expect(_.omit(reg.types.FooObject, [ '_typeConfig' ]))
      .to.deep.equal(_.omit(FooObject, [ '_typeConfig' ]))
  })

  it('generates an Input', () => {
    const reg = new Generator(graphql).generate(
      new Definition().use({
        types: {
          FooInput: FooInputDef
        }
      })
    )

    expect(_.omit(reg.types.FooInput, [ '_typeConfig' ]))
      .to.deep.equal(_.omit(FooInput, [ '_typeConfig' ]))
  })

  it('generates an Interface', () => {
    const reg = new Generator(graphql).generate(
      new Definition().use({
        types: {
          FooInterface1: FooInterface1Def
        }
      })
    )

    expect(_.omit(reg.types.FooInterface1, [ '_typeConfig' ]))
      .to.deep.equal(_.omit(FooInterface1, [ '_typeConfig' ]))
  })

  it('generates a Union', () => {
    const reg = new Generator(graphql).generate(
      new Definition().use({
        types: {
          FooUnion: FooUnionDef
        }
      })
    )

    expect(_.omit(reg.types.FooUnion, [ '_typeConfig' ]))
      .to.deep.equal(_.omit(FooUnion, [ '_typeConfig' ]))
  })

  it('generates a Scalar', () => {
    const reg = new Generator(graphql).generate(
      new Definition().use({
        types: {
          FooScalar: FooScalarDef
        }
      })
    )

    expect(_.omit(reg.types.FooScalar, [ '_scalarConfig' ]))
      .to.deep.equal(_.omit(FooScalar, [ '_scalarConfig' ]))
  })

  it('generates a Schema', () => {
    const reg = new Generator(graphql).generate(
      new Definition().use({
        types: {
          FooSchemaQuery
        },
        schemas: {
          FooSchema: FooSchemaDef
        }
      })
    )

    expect(reg.schemas.FooSchema).to.be.an.instanceOf(GraphQLSchema)
  })
})
