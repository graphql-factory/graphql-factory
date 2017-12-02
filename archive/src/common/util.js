import _ from './lodash.custom'
import { Kind } from 'graphql'

const LITERAL_RX = /^```([\w]+)```$/
const DIRECTIVE_RX = /^@/

/**
 * Determines if an object but not an array
 * @param obj
 * @returns {boolean}
 */
export function isHash (obj) {
  return _.isObject(obj) && !_.isArray(obj)
}

/**
 * Gets the constructor name
 * @param obj
 */
export function constructorName (obj) {
  return _.get(obj, 'constructor.name')
}

/**
 * Determines the type of a value and returns a
 * name with stringified value if able
 * @param obj
 * @returns {*}
 */
export function getType (obj) {
  if (Array.isArray(obj)) {
    return [ 'array', obj ]
  } else if (obj === 'undefined') {
    return [ 'undefined', 'undefined' ]
  } else if (obj === null) {
    return [ 'null', 'null' ]
  } else if (typeof obj === 'string') {
    // check for literal string which will be unquoted and
    // have the literal markers removed
    if (obj.match(LITERAL_RX)) {
      return [ 'literal', obj.replace(LITERAL_RX, '$1') ]
    }
    return [ 'string', `"${obj}"` ]
  } else if (typeof obj === 'number') {
    return String(obj).indexOf('.') !== -1
      ? [ 'float', String(obj) ]
      : [ 'int', String(obj) ]
  } else if (typeof obj === 'boolean') {
    return [ 'boolean', String(obj) ]
  } else if (obj instanceof Date) {
    return [ 'date', JSON.stringify(obj) ]
  }
  return [ typeof obj, obj ]
}

/**
 * Converts args to
 * @param obj
 * @param replaceBraces
 * @returns {undefined}
 */
export function toArgs (obj, replaceBraces = false) {
  const [ type, value ] = getType(obj)
  let result
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
    ? result.replace(/^[{[]([\S\s]+)[}\]]$/, '$1')
    : result
}

/**
 * Gets a string of directives
 * @param directives
 * @param reason
 * @returns {*}
 */
export function getDirectives (definition, reason) {
  const directives = {}

  _.forEach(definition, (value, key) => {
    if (key.match(DIRECTIVE_RX)) {
      directives[key] = value
    }
  })

  if (_.isString(reason)) directives.deprecated = { reason }
  if (!_.keys(directives).length) return ''

  return ' ' + _.map(directives, (value, name) => {
    return !isHash(value)
      ? `${name}`
      : `${name}(${toArgs(value, true)})`
  }).join(' ')
}


/**
 * Returns the appropriate definition key to store the
 * definition in
 * @param kind
 * @returns {*}
 */
export function definitionKey (kind) {
  switch (kind) {
    case Kind.SCHEMA_DEFINITION:
      return 'schemas'
    case Kind.DIRECTIVE_DEFINITION:
      return 'directives'
    case Kind.TYPE_EXTENSION_DEFINITION:
      return 'extensions'
    case Kind.SCALAR_TYPE_DEFINITION:
    case Kind.OBJECT_TYPE_DEFINITION:
    case Kind.INPUT_OBJECT_TYPE_DEFINITION:
    case Kind.ENUM_TYPE_DEFINITION:
    case Kind.UNION_TYPE_DEFINITION:
    case Kind.INTERFACE_TYPE_DEFINITION:
      return 'types'
    case 'Function':
      return 'functions'
    default:
      return null
  }
}

/*
export function inspect (obj) {
  console.log('<!-- INSPECTING\n\n')
  _.forEach(obj, (v, k) => {
    console.log(k, ':', v)
  })
  console.log('\n\n/INSPECTING -->\n\n')
}

export function pretty (obj) {
  console.log(JSON.stringify(obj, null, '  '))
}
*/

export function indent (count = 1, value = '  ') {
  return new Array(count).fill(value).join('')
}

export function stringValue (str) {
  return _.isString(str) && str !== ''
}
