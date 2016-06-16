var chai = global.chai = require('chai')
var rewire = global.rewire = require('rewire')
var graphql = global.graphql = require('graphql')
var private = global.private = rewire('../index')
var factory = global.factory = require('../index')(graphql)
var expect = global.expect = chai.expect

var unitTests = require('./unit')

unitTests()