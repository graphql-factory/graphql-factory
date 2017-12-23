import { SchemaDefinition, directives } from '../src'
import {
  printSchema,
  DirectiveLocation
} from 'graphql'
import _ from 'lodash'

const data = [
  { id: '1', name: 'foo1' },
  { id: '2', name: 'foo2' },
  { id: '3', name: 'foo3' },
  { id: '4', name: 'foo4' }
]

class Human {
  constructor(id, name, height) {
    this.id = id
    this.name = name
    this.height = height
  }
}
class Droid {
  constructor(id, name, primaryFunction) {
    this.id = id
    this.name = name
    this.primaryFunction = primaryFunction
  }
}
class Starship {
  constructor(id, name, length) {
    this.id = id
    this.name = name
    this.length = length
  }
}

const humans = [
  { id: 'h1', name: 'Leia Organa', height: 1.5 },
  { id: 'h2', name: 'Han Solo', height: 1.8 },
  { id: 'h3', name: 'Luke Skywalker', height: 1.6 },
  { id: 'h4', name: 'Boba Fet', height: 1.7 }
]
const droids = [
  { id: 'd1', name: 'C3PO', primaryFunction: 'worrying' },
  { id: 'd2', name: 'R2D2', primaryFunction: 'being awesome' },
  { id: 'd3', name: 'BB8', primaryFunction: 'being awesome' }
]

const starships = [
  { id: 's1', name: 'x-wing', length: 10.1 },
  { id: 's2', name: 'tie', length: 9.2 },
  { id: 's3', name: 'destroyer', length: 5001.2 }
]

function searchResolver(source, args, context, info) {
  const results = _.union(humans, droids, starships).filter(o => {
    const searchable = _.map(_.values(o)).join(' ');
    return searchable.match(new RegExp(args.text, 'i'))
  })
  return results[0]
}

const schema = new SchemaDefinition()
  .use({
    directives: {
      resolve: directives.resolve,
      typeDef: directives.typeDef,
      test: {
        locations: _.values(DirectiveLocation),
        args: {
          value: { type: 'String' }
        },
        resolve(source, args, context, info) {
          console.log('TEST', info.location, args)
        }
      }
    }
  })
  .use({
    functions: {
      readFoo: (source, args) => {
        return _.find(data, args);
      },
      searchResolver,
      isHuman: value => _.has(value, 'height'),
      isDroid: value => _.has(value, 'primaryFunction'),
      isStarship: value => _.has(value, 'length')
    }
  })
  .use(`
    type Foo {
      id: String!
      name: String
    }
    type Human @typeDef(isTypeOf: "isHuman") {
      id: String!
      name: String!
      height: Float
    }
    type Droid @typeDef(isTypeOf: "isDroid") {
      id: String!
      name: String!
      primaryFunction: String
    }
    type Starship @typeDef(isTypeOf: "isStarship") {
      id: String!
      name: String!
      length: Float
    }
    union SearchResult = Human | Droid | Starship

    type Query {
      search(text: String!): SearchResult
        @resolve(resolver: "searchResolver")
      readFoo(id: String!): Foo @resolve(resolver: "readFoo")
    }
    schema {
      query: Query
    }
  `)
  .use({ schema: { directives: [ 'resolve', 'test', 'typeDef' ] } })
  .buildSchema({ useMiddleware: true })
  //schema.getType('Query').getFields().search.resolve = searchResolver
  //schema.getType('Human').isTypeOf = value => _.has(value, 'height')
  //schema.getType('Droid').isTypeOf = value => _.has(value, 'primaryFunction')
  //schema.getType('Starship').isTypeOf = value => _.has(value, 'length')
// console.log(schema)

const unionQuery = `
query Search {
  search(text: "o") {
    ... on Human {
      name
      height
    }
    ... on Droid {
      name
      primaryFunction
    }
    ... on Starship {
      name
      length
    }
  }
}
`

const mixedFrag = `
query Mixed {
  search(text: "o") {
    ... on Human @test(value: "human inline") {
      ...resultName @test(value: "frag spread")
      height
    }
    ... on Droid @test(value: "droid inline") {
      name
      primaryFunction
    }
    ... on Starship @test(value: "droid inline") {
      name
      length
    }
  }
}

fragment resultName on Human {
  name
}
`

const fragmentQuery = `
query Frag {
  readFoo(id: "1") {
    id
    ...fullFoo
  }
}

fragment fullFoo on Foo {
  id
  ...fooName
}
fragment fooName on Foo {
  name
}
`


schema.request({
  source: mixedFrag
})
.then(r => console.log(JSON.stringify(r, null, '  ')))
.catch(console.error)
