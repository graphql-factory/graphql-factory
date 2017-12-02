function hasTest (tests, path) {
  if (tests.indexOf('all') !== -1) return true
  for (var testPath of tests) {
    if (testPath.match(path)) return true
  }
  return false
}

module.exports = {
  hasTest: hasTest
}