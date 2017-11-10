var graphql = require('graphql')

var x = graphql.parse('\n# test\ndirective @test(if: String! = "Hi") on field | schema')
var y = graphql.buildSchema(`
type Query {
  read: String
}

directive @test on field

schema {
  query: Query
}
`)
console.log(JSON.stringify(y, null, '  '))