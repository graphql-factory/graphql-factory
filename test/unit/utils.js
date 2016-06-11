var utils = factory.utils

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
    expect(fn(null)).to.equal(true)
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
    expect(fn({a: 1, b: 2}, 'a')).to.equal(true)
    expect(fn({a: 1, b: 2}, 'c')).to.equal(false)
    expect(fn({a: 1, b: 2}, null)).to.equal(false)
    expect(fn()).to.equal(false)
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
  
  //  mergeDeep
  it('mergeDeep should return a merged hash of 2 or more objects where the first hash has been mutated', function (done) {
    var fn = utils.mergeDeep
    expect(fn({ a: { b: 0 } }, { a: { c : 1 } })).to.deep.equal({a: { b: 0, c: 1 }})
    expect(fn({ a: { b: 0 } }, { a: { c : 1 } }, { a: { d: 2 }, x: 10 })).to.deep.equal({a: { b: 0, c: 1, d: 2 }, x: 10 })
    expect(fn({ a: { b: 0 } }, { a: 1 })).to.deep.equal({a: 1 })
    expect(fn({ a: { b: [1, 2, 3] } }, { a: { b : 1 } })).to.deep.equal({a: { b: 1 }})
    expect(fn({ a: { b: [1, 2, 3] } }, { a: { b : [4, 5, 6] } })).to.deep.equal({a: { b: [4, 5, 6] }})
    done()
  })
})