'use strict';

/* lodash like functions to remove dependency on lodash */

function isFunction (obj) {
  return typeof obj === 'function'
}

function isString (obj) {
  return typeof obj === 'string'
}

function isArray (obj) {
  return Array.isArray(obj)
}

function isDate (obj) {
  return obj instanceof Date
}

function isObject (obj) {
  return typeof obj === 'object' && obj !== null
}

function isNumber (obj) {
  return !isNaN(obj)
}

function isHash (obj) {
  return isObject(obj) && !isArray(obj) && !isDate(obj) && obj !== null
}

function includes (obj, key) {
  try {
    return isArray(obj) && obj.indexOf(key) !== -1
  } catch (err) {
    return false
  }
}

function toLower (str) {
  if (typeof str === 'string') return str.toLocaleLowerCase()
  return ''
}

function toUpper (str) {
  if (typeof str === 'string') return str.toUpperCase()
  return ''
}

function ensureArray (obj = []) {
  return isArray(obj) ? obj : [obj]
}

function isEmpty (obj) {
  if (!obj) return true
  else if (isArray(obj) && !obj.length) return true
  else if (isHash(obj) && !keys(obj).length) return true
  return false
}

function keys (obj) {
  try {
    return Object.keys(obj)
  } catch (err) {
    return []
  }
}

function capitalize (str) {
  if (isString(str) && str.length > 0) {
    let first = str[0]
    let rest = str.length > 1 ? str.substring(1) : ''
    str = [first.toUpperCase(), rest.toLowerCase()].join('')
  }
  return str
}

function stringToPathArray (pathString) {
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

function has (obj, path) {
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

function without () {
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

function map (obj, fn) {
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

function mapValues (obj, fn) {
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

function remap (obj, fn) {
  let newObj = {}
  forEach(obj, (v, k) => {
    let newMap = fn(v, k)
    if (has(newMap, 'key') && has(newMap, 'value')) newObj[newMap.key] = newMap.value
    else newMap[k] = v
  })
  return newObj
}

function filter (obj, fn) {
  let newObj = []
  if (!isArray(obj)) return newObj
  forEach(obj, function (v, k) {
    if (fn(v, k)) newObj.push(v)
  })
  return newObj
}

function omitBy (obj, fn) {
  let newObj = {}
  if (!isHash(obj)) return newObj
  forEach(obj, function (v, k) {
    if (!fn(v, k)) newObj[k] = v
  })
  return newObj
}

function omit (obj, omits = []) {
  let newObj = {}
  omits = ensureArray(omits)
  forEach(obj, (v, k) => {
    if (!includes(omits, k)) newObj[k] = v
  })
  return newObj
}

function pickBy (obj, fn) {
  let newObj = {}
  if (!isHash(obj)) return newObj
  forEach(obj, function (v, k) {
    if (fn(v, k)) newObj[k] = v
  })
  return newObj
}

function pick (obj, picks = []) {
  let newObj = {}
  picks = ensureArray(picks)
  forEach(obj, (v, k) => {
    if (includes(picks, k)) newObj[k] = v
  })
  return newObj
}

function get (obj, path, defaultValue) {
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

function set (obj, path, val) {
  let value = obj
  let fields = isArray(path) ? path : stringToPathArray(path)
  forEach(fields, (p, idx) => {
    if (idx === fields.length - 1) value[p] = val
    else if (!value[p]) value[p] = isNumber(p) ? [] : {}
    value = value[p]
  })
}

function merge () {
  let args = Array.prototype.slice.call(arguments)
  if (args.length === 0) return {}
  else if (args.length === 1) return args[0]
  else if (!isHash(args[0])) return {}
  let targetObject = args[0]
  let sources = args.slice(1)

  //  define the recursive merge function
  let _merge = function (target, source) {
    for (let k in source) {
      if (!target[k] && isHash(source[k])) {
        target[k] = _merge({}, source[k])
      } else if (target[k] && isHash(target[k]) && isHash(source[k])) {
        target[k] = merge(target[k], source[k])
      } else {
        if (isArray(source[k])) {
          target[k] = []
          for (let x in source[k]) {
            if (isHash(source[k][x])) {
              target[k].push(_merge({}, source[k][x]))
            } else if (isArray(source[k][x])) {
              target[k].push(_merge([], source[k][x]))
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
    if (isHash(sources[k])) _merge(targetObject, sources[k])
  }
  return targetObject
}

function clone (obj) {
  return merge({}, obj)
}

/*
 * Gets the path of a value by getting the location of the field and traversing the selectionSet
 */
function getFieldPath (info, maxDepth) {
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


function getSchemaOperation (info) {
  var _type = ['_', get(info, 'operation.operation'), 'Type'].join('');
  return get(info, ['schema', _type].join('.'), {});
}

/*
 * Gets the return type name of a query (returns shortened GraphQL primitive type names)
 */
function getReturnTypeName (info) {
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
function getRootFieldDef (info, path) {
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
function getTypeConfig (info, path) {
  path = path ? '_typeConfig.'.concat(path) : '_typeConfig'
  return get(getSchemaOperation(info), path, {});
}


var utils = Object.freeze({
  isFunction: isFunction,
  isString: isString,
  isArray: isArray,
  isDate: isDate,
  isObject: isObject,
  isNumber: isNumber,
  isHash: isHash,
  includes: includes,
  toLower: toLower,
  toUpper: toUpper,
  ensureArray: ensureArray,
  isEmpty: isEmpty,
  keys: keys,
  capitalize: capitalize,
  stringToPathArray: stringToPathArray,
  has: has,
  forEach: forEach,
  without: without,
  map: map,
  mapValues: mapValues,
  remap: remap,
  filter: filter,
  omitBy: omitBy,
  omit: omit,
  pickBy: pickBy,
  pick: pick,
  get: get,
  set: set,
  merge: merge,
  clone: clone,
  getFieldPath: getFieldPath,
  getSchemaOperation: getSchemaOperation,
  getReturnTypeName: getReturnTypeName,
  getRootFieldDef: getRootFieldDef,
  getTypeConfig: getTypeConfig
});

function Types (gql, definitions) {

  //  primitive types
  const typeMap = {
    'String': gql.GraphQLString,
    'Int': gql.GraphQLInt,
    'Boolean': gql.GraphQLBoolean,
    'Float': gql.GraphQLFloat,
    'ID': gql.GraphQLID
  }

  //  used to return the function from definitions if a string key is provided
  let getFunction = function (fn) {
    if (!fn) return
    fn = isString(fn) ? get(definitions.functions, fn) : fn
    if (isFunction(fn)) return fn.bind(definitions)
  }

  //  determines a field type given a FactoryTypeConfig
  let fieldType = function (field) {
    let isObject = has(field, 'type')
    let type = isObject ? field.type : field
    let isArray$$ = isArray(type)
    type = isArray$$ ? type[0] : type

    if (has(definitions.types, type)) {
      type = definitions.types[type]
    } else if (has(typeMap, type)) {
      type = typeMap[type]
    } else if (has(definitions.externalTypes, type)) {
      type = definitions.externalTypes[type]
    } else if (has(gql, type)) {
      type = gql[type]
    }

    //  type modifiers for list and non-null
    type = isArray$$ ? new gql.GraphQLList(type) : type
    type = (isObject && (field.nullable === false || field.primary)) ? new gql.GraphQLNonNull(type) : type
    return type
  }

  //  resolves the type from the schema, custom types, and graphql itself. supports conditional type
  let getType = function (field, rootType) {
    if (isHash(field) && !has(field, 'type') && has(field, rootType)) return fieldType(field[rootType])
    return fieldType(field)
  }

  //  extend fields using a definition
  let extendFields = function (fields, exts) {
    let extKeys = []
    let customProps = {}
    let defFields = definitions.definition.fields
    fields = fields || {}

    //  check for valid extend config
    if (!exts || (isArray(exts) && exts.length === 0) ||
      (isHash(exts) && keys(exts).length === 0) ||
      (!isString(exts) && !isHash(exts) && !isArray(exts))) {
      return remap(fields, function (value, key) {
        return { key: value.name ? value.name : key, value }
      })
    }

    //  get the bundle keys
    if (isString(exts)) extKeys = [exts]
    else if (isHash(exts)) extKeys = keys(exts)
    else if (isArray(exts)) extKeys = exts

    //  merge bundles and existing fields
    let newFields = clone(fields)
    forEach(extKeys, function (v) {
      if (has(defFields, v)) {
        let fieldTemplate = defFields[v]

        if (!isHash(exts)) {
          //  if a string or array merge the fields
          merge(newFields, fieldTemplate)
        } else {
          //  otherwise look for overrides for each field
          let currentExt = exts[v]
          forEach(fieldTemplate, function (ftVal, ftKey) {
            if (has(currentExt, ftKey)) {
              let extField = currentExt[ftKey]
              if (isArray(extField)) {
                forEach(extField, function (efVal, efIdx) {
                  if (isHash(efVal) && efVal.name) {
                    newFields[efVal.name] = merge({}, ftVal, efVal)
                  } else {
                    newFields[`${ftKey}${efIdx}`] = merge({}, ftVal, efVal)
                  }
                })
              } else {
                newFields[extField.name || ftKey] = merge({}, ftVal, extField)
              }
            }
          })
        }
      }
    })

    //  finally return the merged fields and remap the keys
    return remap(newFields, function (value, key) {
      return { key: value.name ? value.name : key, value }
    })
  }

  //  create a GraphQLArgumentConfig
  let GraphQLArgumentConfig = function (arg, type) {
    return {
      type: getType(arg, type),
      defaultValue: arg.defaultValue,
      description: arg.description
    }
  }

  //  create a InputObjectFieldConfig
  let InputObjectFieldConfig = function (field, type) {
    return {
      type: getType(field, type),
      defaultValue: field.defaultValue,
      description: field.description
    }
  }

  //  create a GraphQLEnumValueConfig
  let GraphQLEnumValueConfig = function (value) {
    if (!isObject(value)) return { value: value }
    return {
      value: value.value,
      deprecationReason: value.deprecationReason,
      description: value.description
    }
  }
  
  //  create a GraphQLEnumValueConfigMap
  let GraphQLEnumValueConfigMap = function (values) {
    return mapValues(values, function (value) {
      return GraphQLEnumValueConfig(value)
    })
  }

  //  create a GraphQLFieldConfigMapThunk
  let GraphQLFieldConfigMapThunk = function (fields, type, objDef) {
    fields = omitBy(extendFields(fields, objDef.extendFields), function (f) {
      return has(f, 'omitFrom') && (includes(f.omitFrom, type) || f.omitFrom === type)
    })
    if (!fields) return
    return () => mapValues(fields, function (field) {
      field = !has(field, 'type') && has(field, type) ? field[type] : field
      return {
        type: getType(field, type),
        args: mapValues(field.args, function (arg) {
          return GraphQLArgumentConfig(arg, type)
        }),
        resolve: getFunction(field.resolve),
        deprecationReason: field.deprecationReason,
        description: field.description
      }
    })
  }

  //  create a GraphQLInterfacesThunk
  let GraphQLInterfacesThunk = function (interfaces) {
    if (!interfaces) return
    let thunk = without(map(interfaces, function (type) {
      let i = getType(type)
      if (i instanceof gql.GraphQLInterfaceType) return i
      else return null
    }), null)
    return (thunk.length > 0) ? () => thunk : undefined
  }

  //  create a InputObjectConfigFieldMapThunk
  let InputObjectConfigFieldMapThunk = function (fields, type, objDef) {
    fields = omitBy(extendFields(fields, objDef.extendFields), function (f) {
      return has(f, 'omitFrom') && (includes(f.omitFrom, type) || f.omitFrom === type)
    })
    if (!fields) return
    return () => mapValues(fields, function (field) {
      return InputObjectFieldConfig(field, type)
    })
  }

  //  create a GraphQLScalarType
  let GraphQLScalarType = function (objDef, objName) {
    return new gql.GraphQLScalarType({
      name: objDef.name || objName,
      description: objDef.description,
      serialize: getFunction(objDef.serialize),
      parseValue: getFunction(objDef.parseValue),
      parseLiteral: getFunction(objDef.parseLiteral)
    })
  }

  //  create a GraphQLObjectType
  let GraphQLObjectType = function (objDef, objName) {
    return new gql.GraphQLObjectType(merge({}, objDef, {
      name: objDef.name || objName,
      interfaces: GraphQLInterfacesThunk(objDef.interfaces),
      fields: GraphQLFieldConfigMapThunk(objDef.fields, 'Object', objDef),
      isTypeOf: getFunction(objDef.isTypeOf),
      description: objDef.description
    }))
  }

  //  create a GraphQLInterfaceType
  let GraphQLInterfaceType = function (objDef, objName) {
    return new gql.GraphQLInterfaceType({
      name: objDef.name || objName,
      fields: GraphQLFieldConfigMapThunk(objDef.fields, 'Interface'),
      resolveType: getFunction(objDef.resolveType),
      description: objDef.description
    })
  }

  //  create a GraphQLEnumType
  let GraphQLEnumType = function (objDef, objName) {
    return new gql.GraphQLEnumType({
      name: objDef.name || objName,
      values: GraphQLEnumValueConfigMap(objDef.values),
      description: objDef.description
    })
  }

  //  create a GraphQLInputObjectType
  let GraphQLInputObjectType = function (objDef, objName) {
    return new gql.GraphQLInputObjectType({
      name: objDef.name || objName,
      fields: InputObjectConfigFieldMapThunk(objDef.fields, 'Input', objDef),
      description: objDef.description
    })
  }

  //  create a GraphQLUnionType
  let GraphQLUnionType = function (objDef, objName) {
    return new gql.GraphQLUnionType({
      name: objDef.name || objName,
      types: map(objDef.types, function (type) {
        return getType(type)
      }),
      resolveType: getFunction(objDef.resolveType),
      description: objDef.description
    })
  }

  //  create a GraphQLSchema
  let GraphQLSchema = function (schema, schemaKey) {
    let getDef = function (op) {
      let type = get(schema, op, {})
      return isString(type) ? get(definitions.definition.types, type, {}) : type
    }
    let getObj = function (op) {
      let obj = get(schema, op, undefined)
      return isString(obj) ?
        getType(obj) : isObject(obj) ?
        GraphQLObjectType(obj, capitalize(op)) : undefined
    }

    //  create a new factory object
    let gqlSchema = new gql.GraphQLSchema({
      query: getObj('query'),
      mutation: getObj('mutation'),
      subscription: getObj('subscription')
    })

    //  add a _factory property the schema object
    gqlSchema._factory = {
      key: schemaKey,
      queryDef: getDef('query'),
      mutationDef: getDef('mutation'),
      subscriptionDef: getDef('subscription')
    }

    //  return the modified object
    return gqlSchema
  }

  //  type to function map
  const typeFnMap = {
    'Input': GraphQLInputObjectType,
    'Enum': GraphQLEnumType,
    'Interface': GraphQLInterfaceType,
    'Object': GraphQLObjectType,
    'Scalar': GraphQLScalarType
  }

  return {
    getType,
    GraphQLSchema,
    GraphQLUnionType,
    GraphQLInputObjectType,
    GraphQLEnumType,
    GraphQLInterfaceType,
    GraphQLObjectType,
    GraphQLScalarType,
    typeFnMap
  }
}

const HAS_FIELDS = ['Object', 'Input', 'Interface']

const TYPE_MAP = {
  Schema: 'Schema',
  GraphQLSchema: 'Schema',
  Scalar: 'Scalar',
  GraphQLScalarType: 'Scalar',
  Object: 'Object',
  GraphQLObjectType: 'Object',
  Interface: 'Interface',
  GraphQLInterfaceType: 'Interface',
  Union: 'Union',
  GraphQLUnionType: 'Union',
  Enum: 'Enum',
  GraphQLEnumtype: 'Enum',
  Input: 'Input',
  GraphQLInputObjectType: 'Input',
  List: 'List',
  GraphQLList: 'List',
  NonNull: 'NonNull',
  GraphQLNonNull: 'NonNull'
}

function getShortType (type) {
  return get(TYPE_MAP, type, null)
}

function hasFields (type) {
  return includes(HAS_FIELDS, getShortType(type))
}

function toTypeDef (obj) {
  return isHash(obj) ? obj : { type: obj }
}

function argsToTypeDef (field) {
  forEach(field.args, (arg, argName) => {
    field.args[argName] = toTypeDef(arg)
  })
}

// moves objects defined on the schema to the types section and references the type
function moveSchemaObjects (def, c) {
  forEach(def.schemas, (schema, schemaName) => {
    let schemaDef = {}
    forEach(schema, (field, fieldName) => {
      if (isHash(field)) {
        let name = field.name || `${schemaName}${capitalize(fieldName)}`
        def.types[name] = field
        schemaDef[fieldName] = name
      } else {
        schemaDef[fieldName] = field
      }
    })
    c.schemas[schemaName] = schemaDef
  })
}


// expands multi types into their own definitions
function expandMultiTypes (def, c, debug) {
  forEach(def.types, (typeDef, typeName) => {
    if (!typeDef.type) {
      c.types[typeName] = { type: 'Object', _typeDef: typeDef }
    } else if (isString(typeDef.type)) {
      c.types[typeName] = { type: typeDef.type, _typeDef: typeDef }
    } else if (isArray(typeDef.type)) {
      forEach(typeDef.type, (multiVal) => {
        if (isString(multiVal)) {
          let name = multiVal === 'Object' ? typeName : typeName + multiVal
          c.types[name] = { type: multiVal, _typeDef: typeDef }
        } else {
          forEach(multiVal, (v, k) => {
            if (k === 'Object' && !v) {
              c.types[typeName] = { type: 'Object', _typeDef: typeDef }
            } else if (k !== 'Object' && !v) {
              c.types[typeName + k] = { type: k, _typeDef: typeDef }
            } else {
              c.types[v] = { type: k, _typeDef: typeDef }
            }
          })
        }
      })
    } else {
      forEach(typeDef.type, (multiVal, multiName) => {
        if (multiName === 'Object' && !multiVal) {
          c.types[typeName] = { type: multiName, _typeDef: typeDef }
        } else if (multiName !== 'Object' && !multiVal) {
          c.types[typeName + multiName] = { type: multiName, _typeDef: typeDef }
        } else {
          c.types[multiVal] = { type: multiName, _typeDef: typeDef }
        }
      })
    }
  })
}

// merges extended fields with base config
function mergeExtendedWithBase (def, c, debug) {
  forEach(c.types, (obj) => {

    let typeDef = omit(obj._typeDef, 'type')

    // at this point we can remove the typedef
    delete obj._typeDef

    if (hasFields(obj.type)) {
      obj.fields = obj.fields || {}

      // get the extend fields and the base definition
      let ext = typeDef.extendFields
      let baseDef = omit(typeDef, 'extendFields')

      // create a base by merging the current type obj with the base definition
      merge(obj, baseDef)

      // examine the extend fields
      if (isString(ext)) {
        let e = get(def, `fields["${ext}"]`, {})
        merge(obj.fields, e)
      } else if (isArray(ext)) {
        forEach(ext, (eName) => {
          let e = get(def, `fields["${eName}"]`, {})
          merge(obj.fields, e)
        })
      } else if (isHash(ext)) {

        forEach(ext, (eObj, eName) => {

          // get the correct field bundle
          let e = get(def, `fields["${eName}"]`, {})

          // loop through each field
          forEach(eObj, (oField, oName) => {

            // look for the field config in the field bundle
            let extCfg = get(e, oName)

            if (extCfg) {
              extCfg = toTypeDef(extCfg)

              // check for field templates
              if (isArray(oField) && oField.length > 1) {
                forEach(oField, (v, i) => {
                  oField[i] = merge({}, extCfg, toTypeDef(v))
                })
              } else {
                eObj[oName] = merge({}, extCfg, toTypeDef(oField))
              }
            }
          })
          merge(obj.fields, e, eObj)
        })
      }
    } else {
      merge(obj, typeDef)

      // create a hash for enum values specified as strings
      if (getShortType(obj.type) === 'Enum') {
        forEach(obj.values, (v, k) => {
          if (!isHash(v)) obj.values[k] = { value: v }
        })
      }
    }
  })
}

function extendFieldTemplates (c, debug) {
  forEach(c.types, (obj, name) => {
    if (obj.fields) {
      let omits = []
      forEach(obj.fields, (field, fieldName) => {
        if (isArray(field) && field.length > 1) {
          omits.push(fieldName)
          // get the field template
          forEach(field, (type, idx) => {
            argsToTypeDef(type)
            if (type.name) {
              let fieldBase = get(obj, `fields["${type.name}"]`, {})
              argsToTypeDef(fieldBase)
              obj.fields[type.name] = merge({}, fieldBase, omit(type, 'name'))
            } else {
              let fieldBase = get(obj, `fields["${idx}"]`, {})
              argsToTypeDef(fieldBase)
              obj.fields[`${fieldName}${idx}`] = merge({}, fieldBase, type)
            }
          })
        }
      })
      obj.fields = omit(obj.fields, omits)
    }
  })
}

function setConditionalTypes (c, debug) {
  forEach(c.types, (obj) => {
    if (obj.fields) {
      let omits = []
      forEach(obj.fields, (field, fieldName) => {
        if (isHash(field)) {
          if (!field.type) {
            if (field[obj.type]) {
              let typeDef = field[obj.type]
              typeDef = toTypeDef(typeDef)
              argsToTypeDef(typeDef)
              obj.fields[fieldName] = typeDef
            } else {
              omits.push(fieldName)
            }
          } else if (field.omitFrom) {
            let omitFrom = isArray(field.omitFrom) ? field.omitFrom : [field.omitFrom]
            if (includes(omitFrom, obj.type)) {
              omits.push(fieldName)
            } else {
              obj.fields[fieldName] = omit(obj.fields[fieldName], 'omitFrom')
              argsToTypeDef(obj.fields[fieldName])
            }
          }
        } else {
          obj.fields[fieldName] = { type: field }
        }
      })
      obj.fields = omit(obj.fields, omits)
    }
  })
}


function compile (definition, debug) {
  let def = clone(definition)
  let c = {
    fields: def.fields || {},
    types: {},
    schemas: {}
  }

  // first check if schema fields are objects, if they are, move them to the types
  moveSchemaObjects(def, c, debug)

  // expand multi-types
  expandMultiTypes(def, c, debug)

  // merge extended fields and base configs
  mergeExtendedWithBase(def, c, debug)

  // extend field templates
  extendFieldTemplates(c, debug)

  // omit fields and set conditional types
  setConditionalTypes(c, debug)

  return c
}

let _ = utils

let factory = function (gql) {
  let plugins = {}
  let definitions = {
    globals: {},
    fields: {},
    functions: {},
    externalTypes: {},
    types: {},
    schemas: {}
  }
  let t = Types(gql, definitions)
  let typeFnMap = t.typeFnMap

  //  check for valid types
  let validateType = function (type) {
    if (!_.has(typeFnMap, type)) {
      throw `InvalidTypeError: "${type}" is not a valid object type in the current context`
    }
  }

  //  construct a type name
  let makeTypeName = function (t, typeDef, typeName, nameOverride) {
    if (t == 'Object') return nameOverride || typeDef.name || typeName
    else return nameOverride || (typeDef.name || typeName).concat(t)
  }

  //  add a hash type
  let addTypeHash = function (_types, type, typeDef, typeName) {
    _.forEach(type, (tName, tType) => {
      validateType(tType)
      _types[tType] = makeTypeName(tType, typeDef, typeName, tName)
    })
  }

  //  add plugin
  let plugin = function (p) {
    if (!p) return
    p = _.isArray(p) ? p : [p]
    _.forEach(p, (h) => {
      if (_.isHash(h)) plugins = _.merge(plugins, h)
    })
  }

  //  make all graphql objects
  let make = function (def = {}, opts = {}) {
    let lib = {}

    // allow plugins to be added with a make option
    plugin(opts.plugin)

    // now merge all plugins into the def
    _.merge(def, plugins)

    // compile the def if no option to suppress
    if (opts.compile !== false) _.merge(def, compile(def))

    // ensure globals and fields have objects
    def.globals = def.globals || {}
    def.fields = def.fields || {}

    //  merge the externalTypes and functions before make
    Object.assign(definitions.externalTypes, def.externalTypes || {})
    Object.assign(definitions.functions, def.functions || {})
    
    //  add the globals and definition to the output
    definitions.globals = def.globals
    definitions.utils = utils

    // before building types, clone the compiled schemaDef
    // and store it in the definition
    definitions.definition = _.clone(_.omit(def, 'globals'))

    let nonUnionDefs = _.omitBy(def.types, (tDef) => {
      return tDef.type === 'Union'
    })
    let unionDefs = _.pickBy(def.types, (tDef) => {
      return tDef.type === 'Union'
    })

    //  build types first since schemas will use them, save UnionTypes for the end
    _.forEach(nonUnionDefs, (typeDef, typeName) => {

      let _types = {}

      //  default to object type
      if (!typeDef.type) typeDef.type = 'Object'

      //  if a single type is defined as a string
      if (_.isString(typeDef.type)) {

        //  validate the type and add it
        validateType(typeDef.type)
        _types[typeDef.type] = typeDef.name || typeName

      } else if (_.isArray(typeDef.type)) {

        //  look at each type in the type definition array
        //  support the case [ String, { Type: Name } ] with defaults
        _.forEach(typeDef.type, (t) => {
          if (_.isString(t)) {
            validateType(t)
            _types[t] = makeTypeName(t, typeDef, typeName)
          } else if (_.isHash(t)) {
            addTypeHash(_types, t, typeDef, typeName)
          }
        })
      } else if (_.isHash(typeDef.type)) {
        addTypeHash(_types, typeDef.type, typeDef, typeName)
      }

      //  add the definitions
      _.forEach(_types, (tName, tType) => {
        definitions.types[tName] = typeFnMap[tType](typeDef, tName)
      })
    })

    //  add union definitions
    _.forEach(unionDefs, (unionDef, unionName) => {
      definitions.types[unionName] = t.GraphQLUnionType(unionDef, unionName)
    })

    //  build schemas
    _.forEach(def.schemas, (schemaDef, schemaName) => {
      //  create a schema
      try {
        definitions.schemas[schemaName] = t.GraphQLSchema(schemaDef, schemaName)

        //  create a function to execute the graphql schmea
        lib[schemaName] = function (query, rootValue, ctxValue, varValues, opName) {
          return gql.graphql(definitions.schemas[schemaName], query, rootValue, ctxValue, varValues, opName)
        }
      } catch (err) {
        console.log(err)
        return false
      }
    })

    lib._definitions = definitions
    return lib
  }
  return { make, plugin, utils, compile }
}

factory.utils = utils

module.exports = factory;