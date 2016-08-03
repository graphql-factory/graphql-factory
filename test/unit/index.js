var utils = require('../utils')

module.exports = function (tests) {
  describe('Unit Tests', function () {
    if (utils.hasTest(tests, 'unit.utils')) require('./utils')
    if (utils.hasTest(tests, 'unit.types')) require('./types')
    if (utils.hasTest(tests, 'unit.compile')) require('./compile')
  })
}