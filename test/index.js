var chai = global.chai = require('chai')
var rewire = global.rewire = require('rewire')
var graphql = global.graphql = require('graphql')
var private = global.private = rewire('../index')
var factory = global.factory = require('../index')(graphql)
var expect = global.expect = chai.expect
var utils = require('./utils')

var opt = require('node-getopt').create([
  ['t', 'test=ARG', 'tests to run using comma separated']
]).bindHelp().parseSystem()

// include tests
var unitTests = require('./unit')

// get tests to run
var tests = (opt.options.test || 'all').split(',')

// run appropriate tests
if (utils.hasTest(tests, /^unit/)) unitTests(tests)