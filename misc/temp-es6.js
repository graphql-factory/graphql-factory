import * as graphql from 'graphql'
import Lang from '../src/definition/language'


const src = `
type Foo {
  id: ID!
  bar: String
}
type FooQuery {
  listUser (id: ID!): [Foo]!
}

schema {
  query: FooQuery
}
`

const l = new Lang(graphql).build(src, 'blah', {
  FooQuery: {
    listUser: {
      resolve () {
        return {}
      }
    }
  }
})

console.log(l)