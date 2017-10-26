const ARRAY = 'ARRAY'
const OBJECT = 'OBJECT'

/**
 * Converts a string path to an array path
 * @param pathString
 * @returns {*}
 */
function toPath (pathString) {
  if (Array.isArray(pathString)) return pathString
  if (typeof pathString === 'number') return [ Math.floor(pathString) ]

  // taken from lodash - https://github.com/lodash/lodash
  let pathRx = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(\.|\[\])(?:\4|$))/g
  let pathArray = []

  if (typeof pathString === 'string') {
    pathString.replace(pathRx, (match, number, quote, string) => {
      pathArray.push(
        quote
          ? string
          : number !== undefined
            ? Number(Math.floor(number))
            : match
      )
      return pathArray[ pathArray.length - 1 ]
    })
  }
  return pathArray
}

/**
 * Iterates over an array or object calling an iteratee
 * @param obj
 * @param fn
 */
function forEach (obj, fn) {
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

/**
 * Determines if value is a non-null object
 * @param value
 * @returns {boolean}
 */
function isObject (value) {
  return typeof value === 'object' && value !== null
}

/**
 * Determines if the object has the key
 * @param object
 * @param key
 * @returns {boolean}
 */
function hasKey (object, key) {
  if (!isObject(object)) return false
  return Object.keys(object).indexOf(String(key)) !== -1
}

/**
 * Get a property from an object
 * @param obj
 * @param path
 * @param defaultValue
 * @returns {*}
 */
function get (obj, path, defaultValue) {
  let fields = toPath(path)
  let o = obj
  while (fields.length) {
    let field = fields.shift()
    if (hasKey(o, field)) {
      if (!fields.length) {
        return o[field]
      }
      o = o[field]
    } else {
      return defaultValue
    }
  }
  return defaultValue
}

/**
 * Checks if an object is recursive
 * @param object
 * @param recursive
 * @returns {boolean}
 */
function isRecursive (object, recursive) {
  return recursive !== false
    && (Array.isArray(object) || isObject(object))
}

class ProxyField {
  constructor () {
    this.path = null
    this.object = null
    this.hidden = false
    this.immutable = true
    this.recursive = false
    this.children = {}
  }

  set (object, options) {
    const { path, hidden, immutable, recursive } = isObject(options)
      ? options
      : {}
    this.path = path
    this.object = object
    this.hidden = hidden === true
    this.immutable = immutable === true
    this.recursive = isRecursive(object, recursive)
  }

  get (field) {
    if (!hasKey(this.children, field) || this.children[field].hidden) {
      throw new Error(`GetError: ${field} is an invalid key or index`)
    }
    const f = this.children[field]
    return f.recursive
      ? f
      : f.path
        ? get(f.object, f.path)
        : f.object
  }
}

/**
 * Sets a value in the config
 * @param config
 * @param prop
 * @param object
 * @param options
 */
function setField (config, prop, object, options) {
  const path = toPath(prop)
  let c = config
  while (path.length) {
    const field = String(path.shift())

    if (!(c[field] instanceof ProxyField)) {
      c[field] = new ProxyField()
    }

    if (path.length) {
      c = [field].children
    } else {
      c.set(object, options)
    }
  }
}


function buildProxy (config) {
  return new Proxy(config, {
    get (target, key) {
      // if (target[key])
      //const field = target[key] instanceof ProxyField ? target[key] :
    }
  })
}

export default class Proxyify {
  constructor (value, options) {
    if (!Array.isArray(value) && !isObject(value)) {
      throw new Error('ProxyifyError: Can only proxyify Arrays and Objects')
    }

    this._config = {}

    forEach(value, (v, k) => {
      this.add(k, v, options)
    })
  }

  /**
   * Adds a proxy for a specific property
   * @param prop
   * @param object
   * @param options
   * @returns {Proxyify}
   */
  add (prop, object, options) {
    const { path, recursive, immutable } = isObject(options)
      ? options
      : {}

    // by default add the property as recursive and immutable
    const opts = {
      recursive: recursive !== false,
      immutable: immutable !== false,
      path
    }
    setField(this._config, prop, object, opts)
    return this
  }

  remove (prop) {
    return this
  }

  proxy () {
    return buildProxy(this._config)
  }
}
