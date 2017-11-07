import _ from 'lodash'

const ENUM_RX = /^:/

export function isHash (obj) {
  return _.isObject(obj) && !_.isArray(obj)
}

export function constructorName (obj) {
  return _.get(obj, 'constructor.name')
}

export function getType (obj) {
  if (Array.isArray(obj)) {
    return ['array', obj]
  } else if (obj === 'undefined') {
    return ['undefined', 'undefined']
  } else if (obj === null) {
    return ['null', 'null']
  } else if (typeof obj === 'string') {
    // enums are marked by starting with a :
    if (obj.match(ENUM_RX)) {
      return ['enum', obj.replace(ENUM_RX, '')]
    }
    return ['string', `"${obj}"`]
  } else if (typeof obj === 'number') {
    return String(obj).indexOf('.') !== -1
      ? ['float', String(obj)]
      : ['int', String(obj)]
  } else if (typeof obj === 'boolean') {
    return ['boolean', String(obj)]
  } else if (obj instanceof Date) {
    return ['date', JSON.stringify(obj)]
  } else {
    return [typeof obj, obj]
  }
}

export function toArgs (obj, replaceBraces = false) {
  const [ type, value ] = getType(obj)
  let result = undefined
  switch (type) {
    case 'undefined':
      break
    case 'array':
      result = `[${_.map(value, v => toArgs(v)).join(', ')}]`
      break
    case 'object':
      result = `{${_.map(value, (v, k) => `${k}: ${toArgs(v)}`).join(', ')}}`
      break
    default:
      result = value
      break
  }

  return replaceBraces
    ? result.replace(/^[\{\[]([\S\s]+)[\}\]]$/, '$1')
    : result
}