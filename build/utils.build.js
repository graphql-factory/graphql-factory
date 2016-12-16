require('babel-register')
var path = require('path')
var compile = require('liteutils')
var dir = path.resolve(__dirname, '../src2/utils')

var config = {
  dash: {
    minify: false,
    include: [
      'circular',
      'contains',
      'ensureArray',
      'filter',
      'find',
      'forEach',
      'get',
      'has',
      'includes',
      'intersection',
      'isArray',
      'isBoolean',
      'isData',
      'isFunction',
      'isHash',
      'isNumber',
      'isObject',
      'isPromise',
      'isString',
      'keys',
      'map',
      'mapValues',
      'mapWith',
      'omitBy',
      'pickBy',
      'pretty',
      'range',
      'set',
      'stringify',
      'union',
      'uniq',
      'without'
    ]
  }
}

compile(config, dir, { postClean: true }).then(function () {
  console.log('Utils build complete!')
})