import { describe, it } from 'mocha'
import { expect } from 'chai'
import Definition from '../definition'

import {
  FooDef
} from './objects'

describe('definition.definition tests', () => {
  it('creates an empty definition', () => {
    const def1 = new Definition()

    expect(def1.definition).to.deep.equal({
      functions: {},
      types: {},
      schemas: {}
    })
  })

  it('creates a type definition', () => {
    const def1 = new Definition().use(FooDef)
    expect(def1._types).to.deep.equal(FooDef.types)
  })
})
