var graphql = require('graphql')

var x = graphql.parse('\n# test\ndirective @test(if: String! = "Hi") on field | schema')

console.log(JSON.stringify(x, null, '  '))