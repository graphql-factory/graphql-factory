/*
 * @name - graphql-obj2arg
 * @description - Convert JavaScript a object into a GraphQL argument string
 * @author - Branden Horiuchi <bhoriuchi@gmail.com>
 *
 */
import * as utils from './utils'

const ARRAY = 'array'
const BOOLEAN = 'boolean'
const DATE = 'date'
const ENUM = 'enum'
const FLOAT = 'float'
const INT = 'int'
const NULL = 'null'
const NUMBER = 'number'
const OBJECT = 'object'
const STRING = 'string'
const UNDEFINED = 'undefined'
const RX_BOOLEAN = /^Boolean::/
const RX_DATE = /^Date::/
const RX_ENUM = /^Enum::/
const RX_FLOAT = /^Float::/
const RX_INT = /^Int::/
const RX_OUTER_BRACES = /^{|^\[|\]$|}$/g

function getType (obj) {
  if (obj === null) {
    return { obj, type: NULL }
  } else if (obj === undefined) {
    return { obj, type: UNDEFINED }
  } else if (obj instanceof utils.Enum) {
    return { obj: obj.value, type: ENUM }
  } else if (typeof obj === STRING) {
    if (obj.match(RX_BOOLEAN)) {
      return { obj: Boolean(obj.replace(RX_BOOLEAN, '')), type: BOOLEAN }
    } else if (obj.match(RX_DATE)) {
      return { obj: new Date(obj.replace(RX_DATE, '')), type: DATE }
    } else if (obj.match(RX_ENUM)) {
      return { obj: obj.replace(RX_ENUM, ''), type: ENUM }
    } else if (obj.match(RX_FLOAT)) {
      return { obj: obj.replace(RX_FLOAT, ''), type: FLOAT }
    } else if (obj.match(RX_INT)) {
      return { obj: obj.replace(RX_INT, ''), type: INT }
    }
    return { obj, type: STRING }
  } else if (typeof obj === BOOLEAN) {
    return { obj, type: BOOLEAN }
  } else if (typeof obj === NUMBER) {
    return obj % 1 === 0
      ? { obj, type: INT }
      : { obj, type: FLOAT }
  } else if (Array.isArray(obj)) {
    return { obj, type: ARRAY }
  } else if (obj instanceof Date) {
    return { obj, type: DATE }
  } else if (typeof obj === OBJECT) {
    return { obj, type: OBJECT }
  }
  return { obj, type: UNDEFINED }
}

const toArguments = function (object, options = {}) {
  const keepNulls = options.keepNulls === true
  const noOuterBraces = options.noOuterBraces === true

  const toLiteral = o => {
    const { obj, type } = getType(o)
    switch (type) {
      case ARRAY:
        const arrList = []
        utils.forEach(obj, v => {
          const arrVal = toLiteral(v)
          if ((arrVal === NULL && keepNulls) || (arrVal && arrVal !== NULL)) {
            arrList.push(arrVal)
          }
        })
        return `[${arrList.join(',')}]`
      case OBJECT:
        const objList = []
        utils.forEach(obj, (v, k) => {
          const objVal = toLiteral(v)
          if ((objVal === NULL && keepNulls) || (objVal && objVal !== NULL)) {
            objList.push(`${k}:${objVal}`)
          }
        })
        return `{${objList.join(',')}}`
      case DATE:
        return `"${obj.toISOString()}"`
      case FLOAT:
        const s = String(obj)
        return s.indexOf('.') === -1
          ? `${s}.0`
          : s
      case NULL:
        return NULL
      case STRING:
        return `"${utils.escapeString(obj)}"`
      case UNDEFINED:
        return undefined
      default:
        return String(obj)
    }
  }

  const objStr = toLiteral(utils.circular(object))
  return noOuterBraces
    ? objStr.replace(RX_OUTER_BRACES, '')
    : objStr
}

toArguments.Enum = utils.Enum
toArguments.escapeString = utils.escapeString
export default toArguments
