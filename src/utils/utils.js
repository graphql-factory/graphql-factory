/* lodash like functions to remove dependency on lodash accept lodash.merge */
import merge from './lodash.merge'
import toObjectString from './obj2arg'

export { toObjectString }
export { merge }

export function noop () {}

// enum type for use with toObjectString function
export function Enum (value) {
  if (!(this instanceof Enum)) return new Enum(value)
  this.value = value
}

export function isBoolean (obj) {
  return obj === true || obj === false
}

export function isEnum (obj) {
  return obj instanceof Enum
}

export function isFunction (obj) {
  return typeof obj === 'function'
}

export function isString (obj) {
  return typeof obj === 'string'
}

export function isArray (obj) {
  return Array.isArray(obj)
}

export function isDate (obj) {
  return obj instanceof Date
}

export function isObject (obj) {
  return typeof obj === 'object' && obj !== null
}

export function isNumber (obj) {
  return !isNaN(obj)
}

export function isHash (obj) {
  return isObject(obj) && !isArray(obj) && !isDate(obj) && obj !== null
}

export function includes (obj, key) {
  try {
    return isArray(obj) && obj.indexOf(key) !== -1
  } catch (err) {
    return false
  }
}

export function toLower (str) {
  if (typeof str === 'string') return str.toLocaleLowerCase()
  return ''
}

export function toUpper (str) {
  if (typeof str === 'string') return str.toUpperCase()
  return ''
}

export function ensureArray (obj = []) {
  return isArray(obj) ? obj : [ obj ]
}

export function castArray (obj) {
  return ensureArray(obj)
}

export function isEmpty (obj) {
  if (!obj) return true
  else if (isArray(obj) && !obj.length) return true
  else if (isHash(obj) && !keys(obj).length) return true
  return false
}

export function keys (obj) {
  try {
    return Object.keys(obj)
  } catch (err) {
    return []
  }
}

export function capitalize (str) {
  if (isString(str) && str.length > 0) {
    const first = str[0]
    const rest = str.length > 1 ? str.substring(1) : ''
    return [ first.toUpperCase(), rest.toLowerCase() ].join('')
  }
  return str
}

export function stringToPathArray (pathString) {
  // taken from lodash - https://github.com/lodash/lodash
  const pathRx = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(\.|\[\])(?:\4|$))/g
  const pathArray = []

  if (isString(pathString)) {
    pathString.replace(pathRx, function (match, number, quote, string) {
      const part = quote
        ? string
        : (number !== undefined)
          ? Number(number)
          : match
      pathArray.push(part)
      return pathArray[pathArray.length - 1]
    })
  }
  return pathArray
}

export function toPath (pathString) {
  return stringToPathArray(pathString)
}

export function has (obj, path) {
  let value = obj
  const fields = isArray(path) ? path : stringToPathArray(path)
  if (fields.length === 0) return false
  try {
    for (const f in fields) {
      if (value[fields[f]] === undefined) return false
      value = value[fields[f]]
    }
  } catch (err) {
    return false
  }
  return true
}

export function forEach (obj, fn) {
  try {
    if (Array.isArray(obj)) {
      let idx = 0
      for (const val of obj) {
        if (fn(val, idx) === false) break
        idx++
      }
    } else {
      for (const key in obj) {
        if (fn(obj[key], key) === false) break
      }
    }
  } catch (err) {
    noop()
  }
}

export function values (obj) {
  const _values = []
  forEach(obj, val => {
    _values.push(val)
  })
  return _values
}

export function without () {
  const output = []
  const args = [ ...arguments ]
  if (args.length === 0) return output
  else if (args.length === 1) return args[0]
  const search = args.slice(1)
  forEach(args[0], function (val) {
    if (!includes(search, val)) output.push(val)
  })
  return output
}

export function map (obj, fn) {
  const output = []
  try {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        output.push(fn(obj[key], key))
      }
    }
  } catch (err) {
    return []
  }
  return output
}

export function mapValues (obj, fn) {
  const newObj = {}
  try {
    forEach(obj, function (v, k) {
      newObj[k] = fn(v, k)
    })
  } catch (err) {
    return obj
  }
  return newObj
}

export function remap (obj, fn) {
  const newObj = {}
  forEach(obj, (v, k) => {
    const newMap = fn(v, k)
    if (has(newMap, 'key') && has(newMap, 'value')) {
      newObj[newMap.key] = newMap.value
    } else {
      newMap[k] = v
    }
  })
  return newObj
}

export function filter (obj, fn) {
  const newObj = []
  if (!isArray(obj)) return newObj
  forEach(obj, function (v, k) {
    if (fn(v, k)) newObj.push(v)
  })
  return newObj
}

export function omitBy (obj, fn) {
  const newObj = {}
  if (!isHash(obj)) return newObj
  forEach(obj, function (v, k) {
    if (!fn(v, k)) newObj[k] = v
  })
  return newObj
}

export function omit (obj, omits = []) {
  const newObj = {}
  forEach(obj, (v, k) => {
    if (!includes(ensureArray(omits), k)) newObj[k] = v
  })
  return newObj
}

export function pickBy (obj, fn) {
  const newObj = {}
  if (!isHash(obj)) return newObj
  forEach(obj, function (v, k) {
    if (fn(v, k)) newObj[k] = v
  })
  return newObj
}

export function pick (obj, picks = []) {
  const newObj = {}
  forEach(obj, (v, k) => {
    if (includes(ensureArray(picks), k)) newObj[k] = v
  })
  return newObj
}

export function get (obj, path, defaultValue) {
  let value = obj
  const fields = isArray(path) ? path : toPath(path)
  if (fields.length === 0) return defaultValue

  try {
    for (const f in fields) {
      if (value[fields[f]] === undefined) return defaultValue
      value = value[fields[f]]
    }
  } catch (err) {
    return defaultValue
  }
  return value
}

export function intersection () {
  const args = [ ...arguments ]
  if (!args.length) return []

  return args.reduce((prev, cur) => {
    if (!Array.isArray(prev) || !Array.isArray(cur)) return []
    const left = new Set(prev)
    const right = new Set(cur)
    const i = [ ...left ].filter(item => right.has(item))
    return [ ...i ]
  }, args[0])
}

export function union () {
  const args = [ ...arguments ]
  if (!args.length) return []

  try {
    const u = args.reduce((prev, cur) => {
      if (!isArray(prev) || !isArray(cur)) return []
      return prev.concat(cur)
    }, [])

    return [ ...new Set(u) ]
  } catch (err) {
    return []
  }
}

export function set (obj, path, val) {
  let value = obj
  const fields = isArray(path)
    ? path
    : stringToPathArray(path)
  forEach(fields, (p, idx) => {
    if (idx === fields.length - 1) value[p] = val
    else if (value[p] === undefined) value[p] = isNumber(p) ? [] : {}
    value = value[p]
  })
}

export function clone (obj) {
  return merge({}, obj)
}

export function typeOf (obj) {
  if (obj === undefined) return 'UNDEFINED'
  if (obj === null) return 'NULL'
  if (isBoolean(obj)) return 'BOOLEAN'
  if (isArray(obj)) return 'ARRAY'
  if (isString(obj)) return 'STRING'
  if (isNumber(obj)) return 'NUMBER'
  if (isDate(obj)) return 'DATE'
  if (isHash(obj)) return 'HASH'
  if (isObject(obj)) return 'OBJECT'
}

/*
 * Gets the path of a value by getting the location
 * of the field and traversing the selectionSet
 */
export function getFieldPath (info, maxDepth = 50) {
  const loc = get(info, 'fieldNodes[0].loc') || get(info, 'fieldASTs[0].loc')
  let stackCount = 0

  const traverseFieldPath = function (selections, start, end, fieldPath) {
    const fPath = fieldPath || []

    const sel = get(filter(selections, s => {
      return s.loc.start <= start && s.loc.end >= end
    }), '[0]')

    if (sel) {
      const l = sel.name.loc
      fPath.push(sel.name.value)
      if (l.start !== start && l.end !== end && stackCount < maxDepth) {
        stackCount++
        traverseFieldPath(sel.selectionSet.selections, start, end, fPath)
      }
    }
    return fPath
  }
  const selections = info.operation.selectionSet.selections
  if (!selections || isNaN(loc.start) || isNaN(loc.end)) return
  return traverseFieldPath(selections, loc.start, loc.end)
}

export function getSchemaOperation (info) {
  const _type = [ '_', get(info, 'operation.operation'), 'Type' ].join('')
  return get(info, [ 'schema', _type ].join('.'), {})
}

/*
 * Gets the return type name of a query
 * (returns shortened GraphQL primitive type names)
 */
export function getReturnTypeName (info) {
  try {
    const p = '_fields["' + info.fieldName + '"].type'
    let typeObj = get(getSchemaOperation(info), p, {})

    while (!typeObj.name) {
      typeObj = typeObj.ofType
      if (!typeObj) break
    }
    return typeObj.name
  } catch (err) {
    return null
  }
}

/*
 * Gets the field definition
 */
export function getRootFieldDef (info, path) {
  const fldPath = get(getFieldPath(info), '[0]')
  const queryType = info.operation.operation
  const opDef = get(info, 'schema._factory.' + queryType, {})
  let fieldDef = get(opDef, 'fields["' + fldPath + '"]', undefined)

  //  if a field def cannot be found, try to find it in the extendFields
  if (!fieldDef && has(opDef, 'extendFields')) {
    forEach(opDef.extendFields, v => {
      if (has(v, fldPath)) fieldDef = get(v, '["' + fldPath + '"]', {})
    })
  }

  return path ? get(fieldDef, path, {}) : fieldDef
}

/*
 * Returns the _typeConfig object of the schema operation (query/mutation)
 * Can be used to pass variables to resolve functions which use this function
 * to access those variables
 */
export function getTypeConfig (info, path) {
  const p = path
    ? '_typeConfig.'.concat(path)
    : '_typeConfig'
  return get(getSchemaOperation(info), p, {})
}

// removes circular references
export function circular (obj, value = '[Circular]') {
  const circularEx = (_obj, key = null, seen = []) => {
    seen.push(_obj)
    if (isObject(_obj)) {
      forEach(_obj, (o, i) => {
        if (includes(seen, o)) {
          _obj[i] = isFunction(value)
            ? value(_obj, key, seen.slice(0))
            : value
        } else {
          circularEx(o, i, seen.slice(0))
        }
      })
    }
    return _obj
  }

  if (!obj) throw new Error('circular requires an object to examine')
  return circularEx(obj, value)
}

export function stringify () {
  try {
    return JSON.stringify.apply(null, [ ...arguments ])
  } catch (error) {
    return ''
  }
}

export function escapeString (str) {
  if (!isString(str)) return ''
  return String(str)
    .replace(/\\/gm, '\\\\')
    .replace(/\//gm, '\\/')
    .replace(/\b/gm, '')
    .replace(/\f/gm, '\\f')
    .replace(/\n/gm, '\\n')
    .replace(/\r/gm, '\\r')
    .replace(/\t/gm, '\\t')
    .replace(/"/gm, '\\"')
}

export default {}
