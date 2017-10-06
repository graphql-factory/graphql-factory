var events = require('events')
var e = new events.EventEmitter()
e.emit('error', new Error('blah'))