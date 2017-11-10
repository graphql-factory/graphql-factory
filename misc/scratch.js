var graphql = require('graphql')

var x = graphql.parse('\n# test\ndirective @test(if: String! = "Hi") on field | schema')
var y = graphql.parse(`
type Query {
  read: String
}

directive @test on SCHEMA

schema @test {
  query: Query
}
`)

console.log(JSON.stringify(y, null, '  '))