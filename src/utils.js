/* lodash like functions to remove dependency on lodash */

export function isFunction (obj) {
  return typeof obj === 'function'
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
export function has (obj, key) {
  try {
    return Object.keys(obj).includes(key)
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
    if (!search.includes(val)) output.push(val)
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

/* author Salakar @ http://stackoverflow.com/questions/27936772/deep-object-merging-in-es6-es7 */
export function mergeDeep(target, source) {
  if (isHash(target) && isHash(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    });
  }
  return target;
}