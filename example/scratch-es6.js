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
      console.log('CALLED')
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

console.log(lib.types)
/*
lib.Animals('{ getDog { name } }')
  .then((dog) => {
    console.log(JSON.stringify(dog, null, '  '))
  })
  .catch(console.error)
  */