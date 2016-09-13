var utils = factory.utils
var GraphQLCustomDateType = require('graphql-custom-datetype')

describe('Utils', function () {

  //  isString
  it('isString should return true for a String, false otherwise', function (done) {
    var fn = utils.isString
    expect(fn('A String')).to.equal(true)
    expect(fn('')).to.equal(true)
    expect(fn(null)).to.equal(false)
    expect(fn(undefined)).to.equal(false)
    expect(fn(1)).to.equal(false)
    expect(fn(new Date())).to.equal(false)
    expect(fn({})).to.equal(false)
    expect(fn([])).to.equal(false)
    done()
  })

  //  isFunction
  it('isFunction should return true for a Function, false otherwise', function (done) {
    var fn = utils.isFunction
    expect(fn(function () {})).to.equal(true)
    expect(fn(() => {})).to.equal(true)
    expect(fn(null)).to.equal(false)
    expect(fn(undefined)).to.equal(false)
    expect(fn(1)).to.equal(false)
    expect(fn(new Date())).to.equal(false)
    expect(fn({})).to.equal(false)
    expect(fn([])).to.equal(false)
    expect(fn('A String')).to.equal(false)
    done()
  })

  //  isArray
  it('isArray should return true for an Array , false otherwise', function (done) {
    var fn = utils.isArray
    expect(fn([])).to.equal(true)
    expect(fn(new Array())).to.equal(true)
    expect(fn('A String')).to.equal(false)
    expect(fn({})).to.equal(false)
    expect(fn(1)).to.equal(false)
    expect(fn(new Date())).to.equal(false)
    expect(fn(null)).to.equal(false)
    expect(fn(undefined)).to.equal(false)
    done()
  })

  //  isDate
  it('isDate should return true for a Date, false otherwise', function (done) {
    var fn = utils.isDate
    expect(fn(new Date())).to.equal(true)
    expect(fn({})).to.equal(false)
    expect(fn(1)).to.equal(false)
    expect(fn(null)).to.equal(false)
    expect(fn(undefined)).to.equal(false)
    expect(fn([])).to.equal(false)
    expect(fn('A String')).to.equal(false)
    expect(fn('2016-06-10T06:27:25.423Z')).to.equal(false)
    done()
  })

  //  isObject
  it('isObject should return true for an Object, false otherwise', function (done) {
    var fn = utils.isObject
    expect(fn({})).to.equal(true)
    expect(fn(new Date())).to.equal(true)
    expect(fn(null)).to.equal(false)
    expect(fn(undefined)).to.equal(false)
    expect(fn(1)).to.equal(false)
    expect(fn([])).to.equal(true)
    expect(fn('A String')).to.equal(false)
    done()
  })

  //  isHash
  it('isHash should return true for a Hash, false otherwise', function (done) {
    var fn = utils.isHash
    expect(fn({})).to.equal(true)
    expect(fn({ a: 1 })).to.equal(true)
    expect(fn([])).to.equal(false)
    expect(fn(1)).to.equal(false)
    expect(fn(null)).to.equal(false)
    expect(fn(undefined)).to.equal(false)
    expect(fn('A String')).to.equal(false)
    expect(fn(new Date())).to.equal(false)
    done()
  })

  //  includes
  it('includes should return true if an array includes a value, false otherwise', function (done) {
    var fn = utils.includes
    expect(fn([1, 2, 3], 2)).to.equal(true)
    expect(fn(['a', 'b', 'c'], 'b')).to.equal(true)
    expect(fn([1, 2, 3], 'a')).to.equal(false)
    expect(fn([{a: 1}, {a: 2}], {a: 1})).to.equal(false)
    expect(fn(new Date(), null)).to.equal(false)
    expect(fn()).to.equal(false)
    expect(fn([])).to.equal(false)
    done()
  })

  //  has
  it('has should return true if a key exists, false otherwise', function (done) {
    var fn = utils.has
    var obj = {
      a: 1,
      b: 2,
      c: {
        d: 3,
        e: [
          {
            x: {
              y: 1
            }
          }
        ]
      }
    }
    expect(fn(obj, 'a')).to.equal(true)
    expect(fn(obj, 'q')).to.equal(false)
    expect(fn(obj, null)).to.equal(false)
    expect(fn(obj, 'c.e[0].x["y"]')).to.equal(true)
    expect(fn({}, '')).to.equal(false)
    done()
  })

  //  forEach
  it('forEach should iterate over all keys and execute a function', function (done) {
    var fn = utils.forEach
    var a = []
    var b = {}
    fn([1, 2, 3], function (v) {
      a.push(v + 1)
    })
    fn({a: 'z', b: 'x'}, function (v, k) {
      b[v] = k
    })
    expect(a).to.deep.equal([2, 3, 4])
    expect(b).to.deep.equal({z: 'a', x: 'b'})
    done()
  })

  //  without
  it('without should return an array without the specified values', function (done) {
    var fn = utils.without
    expect(fn([1, 2, 3, 4], 1)).to.deep.equal([2, 3, 4])
    expect(fn([1, 2, 3, 4], 1, 4)).to.deep.equal([2, 3])
    expect(fn(['a', 2, 'b', 4], 'a', 4)).to.deep.equal([2, 'b'])
    done()
  })

  //  map
  it('map should return an array of returned values', function (done) {
    var fn = utils.map
    expect(fn([1, 3, 4], function (v, k) {
      return v + 1
    })).to.deep.equal([2, 4, 5])
    expect(fn({a: 1, b: 2}, function (v, k) {
      return v
    })).to.deep.equal([1, 2])
    expect(fn()).to.deep.equal([])
    done()
  })

  //  mapValues
  it('mapValues should return an object with the same keys and values returned by the function', function (done) {
    var fn = utils.mapValues
    expect(fn({ a: 1, b: 2}, function (v, k) {
      return v + 1
    })).to.deep.equal({ a: 2, b: 3 })
    done()
  })

  //  filter
  it('filter should returne a filtered list', function (done) {
    var fn = utils.filter
    expect(fn([1, 2, 3], function (v) {
      return v === 1
    })).to.deep.equal([1])
    expect(fn([
      {a: 1, b: 1},
      {a: 2, b: 1},
      {a: 3, b: 1}
    ], function (v, k) {
      return v.a > 1
    })).to.deep.equal([
      {a: 2, b: 1},
      {a: 3, b: 1}
    ])
    done()
  })

  //  omitBy
  it('omitBy should return an object without fields returned by the function', function (done) {
    var fn = utils.omitBy
    expect(fn({a: 1, b: 2}, function (v, k) {
      return k === 'a'
    })).to.deep.equal({b: 2})
    done()
  })

  //  pickBy
  it('pickBy should return an object with only fields returned by the function', function (done) {
    var fn = utils.pickBy
    expect(fn({a: 1, b: 2}, function (v, k) {
      return k === 'a'
    })).to.deep.equal({a: 1})
    done()
  })
  
  //  merge
  it('merge should return a merged hash of 2 or more objects where the first hash has been mutated', function (done) {
    var fn = utils.merge
    expect(fn({ a: { b: 0 } }, { a: { c : 1 } })).to.deep.equal({a: { b: 0, c: 1 }})
    expect(fn({ a: { b: 0 } }, { a: { c : 1 } }, { a: { d: 2 }, x: 10 })).to.deep.equal({a: { b: 0, c: 1, d: 2 }, x: 10 })
    expect(fn({ a: { b: 0 } }, { a: 1 })).to.deep.equal({a: 1 })
    expect(fn({ a: { b: [1, 2, 3] } }, { a: { b : 1 } })).to.deep.equal({a: { b: 1 }})
    expect(fn({ a: { b: [1, 2, 3] } }, { a: { b : [4, 5, 6] } })).to.deep.equal({a: { b: [4, 5, 6] }})
    expect(fn({}, {type: GraphQLCustomDateType})).to.deep.equal({type: GraphQLCustomDateType})
    done()
  })

  //  get
  it('get should return the value specified by the path or array path and undefined or defaultValue if not found', function (done) {
    var fn = utils.get
    var obj1 = {
      a: {
        b: {
          c: 'ok'
        },
        d: [
          {
            x: 1
          },
          {
            x: 2
          }
        ],
        'e.f': {
          g: [1, 2],
          h: {
            i: 'eye'
          }
        }
      }
    }
    expect(fn(obj1, 'a.b.c')).to.equal('ok')
    expect(fn(obj1, 'a[b].c')).to.equal('ok')
    expect(fn(obj1, ['a', 'b', 'c'])).to.equal('ok')
    expect(fn(obj1, 'x.y.z', 'ok')).to.equal('ok')
    expect(fn(obj1, 'x.y.z')).to.equal(undefined)
    expect(fn(obj1, 'a["e.f"].g[0]')).to.equal(1)
    done()
  })

  // toGraphQLObject
  it('convert an object to an acceptable GraphQL formatted string', function (done) {
    var Enum = utils.Enum
    var fn = utils.toObjectString
    var obj1 = {
      id: '1',
      bool: true,
      enum: Enum('ENUM_TYPE'),
      a: [
        1,
        [2, 3],
        {demo: 'gorgan'}
      ]
    }
    var obj2 = [
      1,
      true,
      { demo: 'gorgan' }
    ]
    var obj3 = {
      id: '1',
      obj: {}
    }
    obj3.obj = obj3

    var obj4 = {
      id: 1,
      name: null,
      fields: {
        name: null
      },
      fields2: {
        name: null,
        sname: 'Doe'
      },
      arr: [1, null]
    }
    var obj5 = [1,2,3]

    expect(fn(obj1)).to.equal('{id:"1",bool:true,enum:ENUM_TYPE,a:[1,[2,3],{demo:"gorgan"}]}')
    expect(fn(obj2)).to.equal('[1,true,{demo:"gorgan"}]')
    expect(fn(obj3)).to.equal('{id:"1",obj:"[Circular]"}')
    expect(fn(obj4)).to.equal('{id:1,fields:{},fields2:{sname:"Doe"},arr:[1]}')
    expect(fn(obj4, {keepNulls:true})).to.equal('{id:1,name:null,fields:{name:null},fields2:{name:null,sname:"Doe"},arr:[1,]}')
    expect(fn(obj4, {noOuterBraces:true})).to.equal('id:1,fields:{},fields2:{sname:"Doe"},arr:[1]')
    expect(fn(obj5, {noOuterBraces:true})).to.equal('1,2,3')
    done()
  })
})