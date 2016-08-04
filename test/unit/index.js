var utils = require('../utils')

module.exports = function (tests) {
  describe('Unit Tests', function () {
    if (utils.hasTest(tests, /^unit.utils|^unit$/)) require('./utils')
    if (utils.hasTest(tests, /^unit.types|^unit$/)) require('./types')
    if (utils.hasTest(tests, /^unit.compile|^unit$/)) require('./compile')
  })
}