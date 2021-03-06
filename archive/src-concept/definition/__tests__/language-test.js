import { describe, it } from 'mocha'
import { expect } from 'chai'
import Language from '../language'

describe('definition.language tests', () => {
  it('converts a type to a factory definition', () => {
    const src = `
      type Foo {
        id: ID!
        bar: String
      }`
    const def = new Language().build(src)

    expect(def.types).to.deep.equal({
      Foo: {
        name: 'Foo',
        fields: {
          id: { type: 'ID!' },
          bar: { type: 'String' }
        }
      }
    })
  })
})
