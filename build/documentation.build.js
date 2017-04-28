var path = require('path')
var documentation = require('documentation')
var streamArray = require('stream-array')
var vfs = require('vinyl-fs')

documentation.build([
  path.resolve(__dirname, '../src/index.js'),
  path.resolve(__dirname, '../src/GraphQLFactory.js'),
  path.resolve(__dirname, '../src/types/constants.js')
], {}, function (err, res) {
  if (err) {
    console.error(err)
    process.exit()
  }

  documentation.formats.html(res, {}, function (err, output) {
    if (err) {
      console.error(err)
      process.exit()
    }
    if (!output) {
      console.error('no output generated, exiting')
      process.exit()
    }
    streamArray(output).pipe(vfs.dest(path.resolve(__dirname, '../docs/api')))
  })
})