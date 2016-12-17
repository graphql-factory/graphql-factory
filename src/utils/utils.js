/* lodash like functions to remove dependency on lodash accept lodash.merge */
import merge from './lodash.merge'
import toObjectString from './obj2arg'
export { toObjectString }
export { merge }

// enum type for use with toObjectString function
export function Enum (value) {
  if (!(this instanceof Enum)) return new Enum(value)
  this.value = value
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
  return isArray(obj) ? obj : [obj]
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
    let first = str[0]
    let rest = str.length > 1 ? str.substring(1) : ''
    str = [first.toUpperCase(), rest.toLowerCase()].join('')
  }
  return str
}

export function stringToPathArray (pathString) {
  // taken from lodash - https://github.com/lodash/lodash
  let pathRx = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(\.|\[\])(?:\4|$))/g
  let pathArray = []

  if (isString(pathString)) {
    pathString.replace(pathRx, function (match, number, quote, string) {
      pathArray.push(quote ? string : (number !== undefined) ? Number(number) : match)
      return pathArray[pathArray.length - 1]
    })
  }
  return pathArray
}

export function has (obj, path) {
  let value = obj
  let fields = isArray(path) ? path : stringToPathArray(path)
  if (fields.length === 0) return false
  try {
    for (let f in fields) {
      if (!value[fields[f]]) return false
      else value = value[fields[f]]
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
      for (let val of obj) {
        if (fn(val, idx) === false) break
        idx++
      }
    } else {
      for (const key in obj) {
        if (fn(obj[key], key) === false) break
      }
    }
  } catch (err) {
    return
  }
}

export function without () {
  let output = []
  let args = [...arguments]
  if (args.length === 0) return output
  else if (args.length === 1) return args[0]
  let search = args.slice(1)
  forEach(args[0], function (val) {
    if (!includes(search, val)) output.push(val)
  })
  return output
}

export function map (obj, fn) {
  let output = []
  try {
    for (const key in obj) {
      output.push(fn(obj[key], key))
    }
  } catch (err) {
    return []
  }
  return output
}

export function mapValues (obj, fn) {
  let newObj = {}
  try {
    forEach(obj, function (v, k) {
      newObj[k] = fn(v)
    })
  } catch (err) {
    return obj
  }
  return newObj
}

export function remap (obj, fn) {
  let newObj = {}
  forEach(obj, (v, k) => {
    let newMap = fn(v, k)
    if (has(newMap, 'key') && has(newMap, 'value')) newObj[newMap.key] = newMap.value
    else newMap[k] = v
  })
  return newObj
}

export function filter (obj, fn) {
  let newObj = []
  if (!isArray(obj)) return newObj
  forEach(obj, function (v, k) {
    if (fn(v, k)) newObj.push(v)
  })
  return newObj
}

export function omitBy (obj, fn) {
  let newObj = {}
  if (!isHash(obj)) return newObj
  forEach(obj, function (v, k) {
    if (!fn(v, k)) newObj[k] = v
  })
  return newObj
}

export function omit (obj, omits = []) {
  let newObj = {}
  omits = ensureArray(omits)
  forEach(obj, (v, k) => {
    if (!includes(omits, k)) newObj[k] = v
  })
  return newObj
}

export function pickBy (obj, fn) {
  let newObj = {}
  if (!isHash(obj)) return newObj
  forEach(obj, function (v, k) {
    if (fn(v, k)) newObj[k] = v
  })
  return newObj
}

export function pick (obj, picks = []) {
  let newObj = {}
  picks = ensureArray(picks)
  forEach(obj, (v, k) => {
    if (includes(picks, k)) newObj[k] = v
  })
  return newObj
}

export function get (obj, path, defaultValue) {
  let value = obj
  let fields = isArray(path) ? path : stringToPathArray(path)
  if (fields.length === 0) return defaultValue

  try {
    for (let f in fields) {
      if (!value[fields[f]]) return defaultValue
      else value = value[fields[f]]
    }
  } catch (err) {
   return defaultValue
  }
  return value
}

export function set (obj, path, val) {
  let value = obj
  let fields = isArray(path) ? path : stringToPathArray(path)
  forEach(fields, (p, idx) => {
    if (idx === fields.length - 1) value[p] = val
    else if (!value[p]) value[p] = isNumber(p) ? [] : {}
    value = value[p]
  })
}

export function clone (obj) {
  return merge({}, obj)
}

/*
 * Gets the path of a value by getting the location of the field and traversing the selectionSet
 */
export function getFieldPath (info, maxDepth) {
  maxDepth = maxDepth || 50

  let loc = get(info, 'fieldASTs[0].loc')
  let stackCount = 0

  let traverseFieldPath = function (selections, start, end, fieldPath) {
    fieldPath = fieldPath || []

    let sel = get(filter(selections, function (s) {
      return s.loc.start <= start && s.loc.end >= end
    }), '[0]')
    if (sel) {
      fieldPath.push(sel.name.value)
      if (sel.name.loc.start !== start && sel.name.loc.end !== end && stackCount < maxDepth) {
        stackCount++
        traverseFieldPath(sel.selectionSet.selections, start, end, fieldPath)
      }
    }
    return fieldPath
  }
  if (!info.operation.selectionSet.selections || isNaN(loc.start) || isNaN(loc.end)) return
  return traverseFieldPath(info.operation.selectionSet.selections, loc.start, loc.end)
}


export function getSchemaOperation (info) {
  var _type = ['_', get(info, 'operation.operation'), 'Type'].join('');
  return get(info, ['schema', _type].join('.'), {});
}

/*
 * Gets the return type name of a query (returns shortened GraphQL primitive type names)
 */
export function getReturnTypeName (info) {
  try {
    var typeObj = get(getSchemaOperation(info), '_fields["' + info.fieldName + '"].type', {})

    while (!typeObj.name) {
      typeObj = typeObj.ofType;
      if (!typeObj) break;
    }
    return typeObj.name;
  } catch (err) {
    console.error(err.message);
  }
}

/*
 * Gets the field definition
 */
export function getRootFieldDef (info, path) {
  let fldPath = get(getFieldPath(info), '[0]')
  let queryType = info.operation.operation
  let opDef = get(info, 'schema._factory.' + queryType + 'Def', {})
  let fieldDef = get(opDef, 'fields["' + fldPath + '"]', undefined)

  //  if a field def cannot be found, try to find it in the extendFields
  if (!fieldDef && has(opDef, 'extendFields')) {
    forEach(opDef.extendFields, function (v, k) {
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
  path = path ? '_typeConfig.'.concat(path) : '_typeConfig'
  return get(getSchemaOperation(info), path, {});
}

// removes circular references
export function circular (obj, value = '[Circular]') {
  let circularEx = (_obj, key = null, seen = []) => {
    seen.push(_obj)
    if (isObject(_obj)) {
      forEach(_obj, (o, i) => {
        if (includes(seen, o)) _obj[i] = isFunction(value) ? value(_obj, key, seen.slice(0)) : value
        else circularEx(o, i, seen.slice(0))
      })
    }
    return _obj
  }

  if (!obj) throw new Error('circular requires an object to examine')
  return circularEx(obj, value)
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