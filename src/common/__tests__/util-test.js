import { describe, it } from 'mocha'
import { expect } from 'chai'

import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull
} from 'graphql'

import {
  constructorName,
  ensureValue,
  getTypeInfo,
  baseDef,
  isListTypeDef,
  valueString,
  resolveThunk,
  assertField
} from '../util'

const obj = {}

const Foo = new GraphQLObjectType({
  name: 'Foo',
  fields: { name: GraphQLString }
})

const FooList = new GraphQLList(Foo)
const FooNonNull = new GraphQLNonNull(Foo)
const FooListNonNull = new GraphQLNonNull(new GraphQLList(Foo))

describe('common.util tests', () => {
  it('gets the constructor name', () => {
    const structName1 = constructorName(obj)
    const structName2 = constructorName(Foo)
    const structName3 = constructorName(() => true)
    const structName4 = constructorName('test')

    expect(structName1).to.equal('Object')
    expect(structName2).to.equal('GraphQLObjectType')
    expect(structName3).to.equal('Function')
    expect(structName4).to.equal('String')

  })

  it('ensures a value', () => {
    const ensure1 = ensureValue('object', undefined, {})
    const ensure2 = ensureValue('object', {}, { foo: true })
    const ensure3 = ensureValue('array', undefined, [])
    const ensure4 = ensureValue('array', [], [ 1 ])
    const ensure5 = ensureValue('array', [ 1 ], [])

    expect(ensure1).to.deep.equal({})
    expect(ensure2).to.deep.equal({})
    expect(ensure3).to.deep.equal([])
    expect(ensure4).to.deep.equal([])
    expect(ensure5).to.deep.equal([ 1 ])
  })

  it('gets type info', () => {
    const info1 = getTypeInfo(Foo)
    const info2 = getTypeInfo(FooList)
    const info3 = getTypeInfo(FooNonNull)
    const info4 = getTypeInfo(FooListNonNull)

    expect(info1).to.deep.equal({
      type: Foo,
      name: 'Foo',
      isList: false,
      isNonNull: false
    })

    expect(info2).to.deep.equal({
      type: Foo,
      name: 'Foo',
      isList: true,
      isNonNull: false
    })

    expect(info3).to.deep.equal({
      type: Foo,
      name: 'Foo',
      isList: false,
      isNonNull: true
    })

    expect(info4).to.deep.equal({
      type: Foo,
      name: 'Foo',
      isList: true,
      isNonNull: true
    })
  })

  it('creates a base definition', () => {
    const def1 = baseDef({ name: 'Foo', isNonNull: false, isList: false })
    const def2 = baseDef({ name: 'Foo', isNonNull: true, isList: false })
    const def3 = baseDef({ name: 'Foo', isNonNull: false, isList: true })
    const def4 = baseDef({ name: 'Foo', isNonNull: true, isList: true })

    expect(def1).to.deep.equal({ type: 'Foo' })
    expect(def2).to.deep.equal({ type: 'Foo', nullable: false })
    expect(def3).to.deep.equal({ type: [ 'Foo' ] })
    expect(def4).to.deep.equal({ type: [ 'Foo' ], nullable: false })
  })

  it('checks if the typeDef is a list', () => {
    const islist1 = isListTypeDef([ 'Foo' ])
    const islist2 = isListTypeDef('Foo')
    const islist3 = isListTypeDef([ 'Foo', 'Bar' ])

    expect(islist1).to.equal(true)
    expect(islist2).to.equal(false)
    expect(islist3).to.equal(false)
  })

  it('checks for a string with value', () => {
    const vs1 = valueString(undefined)
    const vs2 = valueString('')
    const vs3 = valueString(1)
    const vs4 = valueString('Foo')

    expect(vs1).to.equal(false)
    expect(vs2).to.equal(false)
    expect(vs3).to.equal(false)
    expect(vs4).to.equal(true)
  })

  it('resolves a thunk', () => {
    const thunk1 = resolveThunk({})
    const thunk2 = resolveThunk(() => {
      return {}
    })

    expect(thunk1).to.deep.equal({})
    expect(thunk2).to.deep.equal({})
  })

  it('asserts a field', () => {
    const asrt1 = assertField('object', 'Object', 'Foo', {}, 'fields')
    const asrt2 = assertField('object', 'Object', 'Foo', { f: true }, 'fields')
    const asrt3 = assertField('array', 'Object', 'Foo', [], 'fields')
    const asrt4 = assertField('array', 'Object', 'Foo', [ 1 ], 'fields')
    const asrt5 = assertField('function', 'Object', 'Foo', () => true, 'fields')
    const asrt6 = assertField('object', 'Object', 'Foo', undefined, 'fields')

    expect(asrt1).to.be.an.instanceOf(Error)
    expect(asrt2).to.equal(null)
    expect(asrt3).to.be.an.instanceOf(Error)
    expect(asrt4).to.equal(null)
    expect(asrt5).to.equal(null)
    expect(asrt6).to.be.an.instanceOf(Error)
  })
})
