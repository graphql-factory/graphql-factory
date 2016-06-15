var definitions = { types: {}, schemas: {} }
var customTypes = {}
//  use rewire to access private functions
var types = private.__get__('Types')(graphql, customTypes, definitions)

describe('Types', function () {

  //  getType
  it('getType should resolve a GraphQL type given its name or short name', function (done) {
    var fn = types.getType
    expect(fn('GraphQLString')).to.equal(graphql.GraphQLString)
    expect(fn('String')).to.equal(graphql.GraphQLString)
    done()
  })
})