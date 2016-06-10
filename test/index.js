var chai = global.chai = require('chai')
var graphql = global.graphql = require('graphql')
var factory = global.factory = require('../dist')(graphql)
var expect = global.expect = chai.expect

require('./unit')