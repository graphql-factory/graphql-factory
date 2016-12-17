import * as graphql from 'graphql'
import GraphQLFactory from '../src/index'
let factory = GraphQLFactory(graphql)

let definition = {
  types: {
    Dog: {
      fields: {
        name: { type: 'String' }
      }
    },
    DogQuery: {
      fields: {
        getDog: {
          type: 'Dog',
          resolve: 'getDog'
        }
      }
    }
  },
  functions: {
    getDog () {
      return {
        name: 'Spot'
      }
    }
  },
  schemas: {
    Animals: {
      query: 'DogQuery'
    }
  }
}

let lib = factory.make(definition)

lib.Animals('{ getDog { name } }')
  .then((dog) => {
    console.log(JSON.stringify(dog, null, '  '))
  })
  .catch(console.error)