import {
  has as _has,
  keys as _keys,
  capitalize as _capitalize,
  forEach as _forEach,
  isString as _isString,
  isArray as _isArray,
  isObject as _isObject,
  isHash as _isHash,
  isFunction as _isFunction,
  includes as _includes,
  without as _without,
  map as _map,
  mapValues as _mapValues,
  omitBy as _omitBy,
  merge as _merge,
  get as _get
} from './utils'

export default function Types (gql, definitions) {

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
    fn = _isString(fn) ? _get(definitions.functions, fn) : fn
    if (_isFunction(fn)) return fn.bind(definitions)
  }

  //  determines a field type given a FactoryTypeConfig
  let fieldType = function (field) {
    let isObject = _has(field, 'type')
    let type = isObject ? field.type : field
    let isArray = _isArray(type)
    type = isArray ? type[0] : type

    if (_has(definitions.types, type)) {
      type = definitions.types[type]
    } else if (_has(typeMap, type)) {
      type = typeMap[type]
    } else if (_has(definitions.externalTypes, type)) {
      type = definitions.externalTypes[type]
    } else if (_has(gql, type)) {
      type = gql[type]
    }

    //  type modifiers for list and non-null
    type = isArray ? new gql.GraphQLList(type) : type
    type = (isObject && (field.nullable === false || field.primary)) ? new gql.GraphQLNonNull(type) : type
    return type
  }

  //  resolves the type from the schema, custom types, and graphql itself. supports conditional type
  let getType = function (field, rootType) {
    if (_isHash(field) && !_has(field, 'type') && _has(field, rootType)) return fieldType(field[rootType])
    return fieldType(field)
  }

  //  extend fields using a definition
  let extendFields = function (fields, exts) {
    let extKeys = []
    let customProps = {}
    let defFields = definitions.definition.fields
    fields = fields || {}

    //  check for valid extend config
    if (!exts || (_isArray(exts) && exts.length === 0) ||
      (_isHash(exts) && _keys(exts).length === 0) ||
      (!_isString(exts) && !_isHash(exts) && !_isArray(exts))) return fields

    //  get the bundle keys
    if (_isString(exts)) extKeys = [exts]
    else if (_isHash(exts)) extKeys = _keys(exts)
    else if (_isArray(exts)) extKeys = exts

    //  merge bundles and existing fields
    let newFields = _merge({}, fields)
    _forEach(extKeys, function (v) {
      if (_has(defFields, v)) {
        _merge(newFields, defFields[v])

        //  merge custom props
        if (_isHash(exts) && _isHash(exts[v])) _merge(customProps, exts[v])
      }
    })

    //  merge any custom props
    _forEach(customProps, function (prop, name) {
      if (_has(newFields, name)) _merge(newFields[name], prop)
    })

    //  finally return the merged fields
    return newFields
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
    if (!_isObject(value)) return { value: value }
    return {
      value: value.value,
      deprecationReason: value.deprecationReason,
      description: value.description
    }
  }
  
  //  create a GraphQLEnumValueConfigMap
  let GraphQLEnumValueConfigMap = function (values) {
    return _mapValues(values, function (value) {
      return GraphQLEnumValueConfig(value)
    })
  }

  //  create a GraphQLFieldConfigMapThunk
  let GraphQLFieldConfigMapThunk = function (fields, type, objDef) {
    fields = _omitBy(extendFields(fields, objDef.extendFields), function (f) {
      return _has(f, 'omitFrom') && (_includes(f.omitFrom, type) || f.omitFrom === type)
    })
    if (!fields) return
    return () => _mapValues(fields, function (field) {
      field = !_has(field, 'type') && _has(field, type) ? field[type] : field
      return {
        type: getType(field, type),
        args: _mapValues(field.args, function (arg) {
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
    let thunk = _without(_map(interfaces, function (type) {
      let i = getType(type)
      if (i instanceof gql.GraphQLInterfaceType) return i
      else return null
    }), null)
    return (thunk.length > 0) ? () => thunk : undefined
  }

  //  create a InputObjectConfigFieldMapThunk
  let InputObjectConfigFieldMapThunk = function (fields, type, objDef) {
    fields = _omitBy(extendFields(fields, objDef.extendFields), function (f) {
      return _has(f, 'omitFrom') && (_includes(f.omitFrom, type) || f.omitFrom === type)
    })
    if (!fields) return
    return () => _mapValues(fields, function (field) {
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
    return new gql.GraphQLObjectType(_merge({}, objDef, {
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
      types: _map(objDef.types, function (type) {
        return getType(type)
      }),
      resolveType: getFunction(objDef.resolveType),
      description: objDef.description
    })
  }

  //  create a GraphQLSchema
  let GraphQLSchema = function (schema, schemaKey) {
    let getDef = function (op) {
      let type = _get(schema, op, {})
      return _isString(type) ? _get(definitions.definition.types, type, {}) : type
    }
    let getObj = function (op) {
      let obj = _get(schema, op, undefined)
      return _isString(obj) ?
        getType(schema.query) : _isObject(obj) ?
        GraphQLObjectType(obj, _capitalize(op)) : undefined
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