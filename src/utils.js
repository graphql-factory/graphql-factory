/* lodash like functions to remove dependency on lodash */

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
  return typeof obj === 'object'
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
export function has (obj, key) {
  try {
    return includes(Object.keys(obj), key)
  } catch (err) {
    return false
  }
}
export function forEach (obj, fn) {
  try {
    for (const key in obj) {
      if (fn(obj[key], key) === false) break
    }
  } catch (err) {
    return
  }
}
export function without () {
  let output = []
  let args = Array.prototype.slice.call(arguments)
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
export function pickBy (obj, fn) {
  let newObj = {}
  if (!isHash(obj)) return newObj
  forEach(obj, function (v, k) {
    if (fn(v, k)) newObj[k] = v
  })
  return newObj
}

export function get (obj, path, defaultValue) {
  let value = obj
  let fields = isArray(path) ? path : []
  if (isString(path)) {
    let open = false
    let str = ''

    let addPath = function (s, isOpen) {
      if (isNaN(s) && s.length > 0) fields.push(s)
      else if (s.length > 0) fields.push(Number(s))
      open = isOpen
      str = ''
    }

    //  parse the path
    for (let i in path) {
      let c = path[i]
      if (c === '[') addPath(str, true)
      else if (open && c === ']') addPath(str, false)
      else if (!open && c === '.') addPath(str, false)
      else str += c
    }
    addPath(str, false)
  }

  //  loop though each field and attempt to get it
  for (let f in fields) {
    if (!value[fields[f]]) return defaultValue
    else value = value[fields[f]]
  }
  return value
}

export function mergeDeep () {
  let args = Array.prototype.slice.call(arguments)
  if (args.length === 0) return {}
  else if (args.length === 1) return args[0]
  else if (!isHash(args[0])) return {}
  let targetObject = args[0]
  let sources = args.slice(1)

  //  define the recursive merge function
  let merge = function (target, source) {
    for (let k in source) {
      if (!target[k] && isHash(source[k])) {
        target[k] = merge({}, source[k])
      } else if (target[k] && isHash(target[k]) && isHash(source[k])) {
        target[k] = merge(target[k], source[k])
      } else {
        if (isArray(source[k])) {
          target[k] = []
          for (let x in source[k]) {
            if (isHash(source[k][x])) {
              target[k].push(merge({}, source[k][x]))
            } else if (isArray(source[k][x])) {
              target[k].push(merge([], source[k][x]))
            } else {
              target[k].push(source[k][x])
            }
          }
        } else if (isDate(source[k])) {
          target[k] = new Date(source[k])
        } else {
          target[k] = source[k]
        }
      }
    }
    return target
  }

  //  merge each source
  for (let k in sources) {
    if (isHash(sources[k])) merge(targetObject, sources[k])
  }
  return targetObject
}

export function getReturnTypeName (info) {
  try {
    let _type = ['_', info.operation.operation, 'Type'].join('')
    let o = info.schema[_type]
    let selections = info.operation.selectionSet.selections
    let fieldName = selections[selections.length - 1].name.value
    let fieldObj = o._fields[fieldName]
    let typeObj = fieldObj.type
    while (!typeObj.name) {
      typeObj = typeObj.ofType
      if (!typeObj) break
    }
    return typeObj.name
  } catch (err) {
    console.error(err.message)
  }
}