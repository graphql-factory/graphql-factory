import * as graphql from 'graphql'
import GraphQLFactory from '../../src'
import definition from './definition'

let factory = GraphQLFactory(graphql)
let lib = factory.make(definition, {
  plugin: {
    name: 'stuff',
    install (definition) {
      let _self = this

      definition.beforeResolve(function (args, next) {
        console.log('MW', Object.keys(this))
        next()
      })
    }
  }
})

lib.Users(`query ListUsers {
  listUsers {
    id,
    name,
    email
  }
}`)
.then(res => {
  console.log(JSON.stringify(res, null, '  '))
  process.exit()
}, err => {
  console.error(err)
  process.exit()
})