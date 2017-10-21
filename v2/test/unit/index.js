var utils = require('../utils/index')

module.exports = function (tests) {
  describe('Unit Tests', function () {
    if (utils.hasTest(tests, /^unit.utils|^unit$/)) require('./utils')
    if (utils.hasTest(tests, /^unit.compile|^unit$/)) require('./compile')
    if (utils.hasTest(tests, /^unit.query|^unit$/)) require('./query')
  })
}