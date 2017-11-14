// @flow
export default function _hasProperty (obj, prop, enumerable) {
  try {
    if (enumerable === true) {
      return Object.keys(obj).indexOf(prop) !== -1
    }

    const props = Object.getOwnPropertyNames(obj)
    const proto = Object.getPrototypeOf(obj)

    return Object.getOwnPropertyNames(proto)
      .concat(props)
      .indexOf(prop) !== -1
  } catch (err) {
    return false
  }
}