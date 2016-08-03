function hasTest (tests, path) {
  if (tests.indexOf('all') !== -1) return true
  for (var testPath of tests) {
    var rx = new RegExp('^' + testPath)
    if (path.match(rx)) return true
  }
  return false
}

module.exports = {
  hasTest: hasTest
}