import {
  has as _has,
  isArray as _isArray,
  isObject as _isObject,
  isHash as _isHash,
  isFunction as _isFunction,
  includes as _includes,
  without as _without,
  map as _map,
  mapValues as _mapValues,
  omitBy as _omitBy
} from './utils'

export default function Types (gql, customTypes, definitions) {

  //  primitive types
  const typeMap = {
    'String': gql.GraphQLString,
    'Int': gql.GraphQLInt,
    'Boolean': gql.GraphQLBoolean,
    'Float': gql.GraphQLFloat,
    'ID': gql.GraphQLID
  }

  //  resolves the type from the schema, custom types, and graphql itself
  let getType = function (field) {
    let isObject = _has(field, 'type')
    let type = isObject ? field.type : field
    let isArray = _isArray(type)
    type = isArray ? type[0] : type

    if (_has(definitions.types, type)) {
      type = definitions.types[type]
    } else if (_has(typeMap, type)) {
      type = typeMap[type]
    } else if (_has(customTypes, type)) {
      type = customTypes[type]
    } else if (_has(gql, type)) {
      type = gql[type]
    }

    //  type modifiers for list and non-null
    type = isArray ? new gql.GraphQLList(type) : type
    type = (isObject && (field.nullable === false || field.primary)) ? new gql.GraphQLNonNull(type) : type
    return type
  }

  //  allow conditional resolve for multi-types
  let conditionalResolve = function (resolve, type) {
    if (_isFunction(resolve)) return resolve
    else if (_has(resolve, type) && _isFunction(resolve[type])) return resolve[type]
  }

  //  create a GraphQLArgumentConfig
  let GraphQLArgumentConfig = function (arg) {
    return {
      type: getType(arg),
      defaultValue: arg.defaultValue,
      description: arg.description
    }
  }

  //  create a InputObjectFieldConfig
  let InputObjectFieldConfig = function (field) {
    return {
      type: getType(field),
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
  let GraphQLFieldConfigMapThunk = function (fields, type) {
    fields = _omitBy(fields, function (f) {
      return _has(f, 'omitFrom') && (_includes(f.omitFrom, type) || f.omitFrom === type)
    })
    if (!fields) return
    return () => _mapValues(fields, function (field) {
      return {
        type: getType(field.type),
        args: _mapValues(field.args, function (arg) {
          return GraphQLArgumentConfig(arg)
        }),
        resolve: conditionalResolve(field.resolve, type),
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
  let InputObjectConfigFieldMapThunk = function (fields, type) {
    fields = _omitBy(fields, function (f) {
      return _has(f, 'omitFrom') && (_includes(f.omitFrom, type) || f.omitFrom === type)
    })
    if (!fields) return
    return () => _mapValues(fields, function (field) {
      return InputObjectFieldConfig(field)
    })
  }

  //  create a GraphQLScalarType
  let GraphQLScalarType = function (objDef, objName) {
    return new gql.GraphQLScalarType({
      name: objDef.name || objName,
      description: objDef.description,
      serialize: _isFunction(objDef.serialize) ? objDef.serialize : undefined,
      parseValue: _isFunction(objDef.parseValue) ? objDef.parseValue : undefined,
      parseLiteral: objDef.parseValue() ? objDef.parseLiteral : undefined
    })
  }

  //  create a GraphQLObjectType
  let GraphQLObjectType = function (objDef, objName) {
    return new gql.GraphQLObjectType({
      name: objDef.name || objName,
      interfaces: GraphQLInterfacesThunk(objDef.interfaces),
      fields: GraphQLFieldConfigMapThunk(objDef.fields, 'Object'),
      isTypeOf: _isFunction(objDef.isTypeOf) ? objDef.isTypeOf : undefined,
      description: objDef.description
    })
  }

  //  create a GraphQLInterfaceType
  let GraphQLInterfaceType = function (objDef, objName) {
    return new gql.GraphQLInterfaceType({
      name: objDef.name || objName,
      fields: GraphQLFieldConfigMapThunk(objDef.fields, 'Interface'),
      resolveType: _isFunction(objDef.resolveType) ? objDef.resolveType : undefined,
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
      fields: InputObjectConfigFieldMapThunk(objDef.fields, 'Input'),
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
      resolveType: _isFunction(objDef.resolveType) ? objDef.resolveType : undefined,
      description: objDef.description
    })
  }

  //  create a GraphQLSchema
  let GraphQLSchema = function (schema) {
    return new gql.GraphQLSchema({
      query: GraphQLObjectType(schema.query, 'Query'),
      mutation: schema.mutation ? GraphQLObjectType(schema.mutation, 'Mutation') : undefined
    })
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