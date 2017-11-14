// @flow
import _isSettable from './_isSettable'
import _hasProperty from './_hasProperty'

export default function set (object, path, value) {
  if (!_isSettable(object)) return object
  let obj = object
  let fields = path.slice()
  while (fields.length) {
    const prop = fields.shift()
    if (!fields.length) {
      obj[prop] = value
      break
    } else if (!_hasProperty(obj, prop) || !_isSettable(obj[prop])) {
      obj[prop] = typeof prop === 'number'
        ? []
        : {}
    }
    obj = obj[prop]
  }
  return object
}