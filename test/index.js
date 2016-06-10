var chai = global.chai = require('chai')
var rewire = global.rewire = require('rewire')
var graphql = global.graphql = require('graphql')
var private = global.private = rewire('../dist')
var factory = global.factory = require('../dist')(graphql)
var expect = global.expect = chai.expect

var unitTests = require('./unit')

unitTests()