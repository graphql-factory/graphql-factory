'use strict';

/* lodash like functions to remove dependency on lodash */

function isFunction (obj) {
  return typeof obj === 'function'
}
function isArray (obj) {
  return Array.isArray(obj)
}
function isDate (obj) {
  return obj instanceof Date
}
function isObject (obj) {
  return typeof obj === 'object'
}
function isHash (obj) {
  return isObject(obj) && !isArray(obj) && !isDate(obj) && obj !== null
}
function has (obj, key) {
  try {
    return Object.keys(obj).includes(key)
  } catch (err) {
    return false
  }
}
function forEach (obj, fn) {
  try {
    for (const key in obj) {
      if (fn(obj[key], key) === false) break
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
    if (!search.includes(val)) output.push(val)
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

var utils = Object.freeze({
  isFunction: isFunction,
  isArray: isArray,
  isDate: isDate,
  isObject: isObject,
  isHash: isHash,
  has: has,
  forEach: forEach,
  without: without,
  map: map,
  mapValues: mapValues
});

function Types (gql, customTypes, definitions) {

  //  primitive types
  const typeMap = {
    'String': gql.GraphQLString,
    'Int': gql.GraphQLInt,
    'Boolean': gql.GraphQLBoolean,
    'Float': gql.GraphQLFloat,
    'ID': gql.GraphQLID
  }

  //  resolves the type from the schema, custom types, and graphql itself
  let resolveType = function (field) {
    let isObject = has(field, 'type')
    let type = isObject ? field.type : field
    let isArray$$ = isArray(type)
    type = isArray$$ ? type[0] : type

    if (has(definitions.types, type)) {
      type = definitions.types[type]
    } else if (has(typeMap, type)) {
      type = typeMap[type]
    } else if (has(customTypes, type)) {
      type = customTypes[type]
    } else if (has(gql, type)) {
      type = gql[type]
    }

    //  type modifiers for list and non-null
    type = isArray$$ ? new gql.GraphQLList(type) : type
    type = (isObject && (field.nullable === false || field.primary)) ? new gql.GraphQLNonNull(type) : type
    return type
  }

  //  create a GraphQLArgumentConfig
  let GraphQLArgumentConfig = function (arg) {
    return {
      type: resolveType(arg.type),
      defaultValue: arg.defaultValue,
      description: arg.description
    }
  }

  //  create a InputObjectFieldConfig
  let InputObjectFieldConfig = function (field) {
    return {
      type: resolveType(field.type),
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
  let GraphQLFieldConfigMapThunk = function (fields) {
    if (!fields) return
    return () => mapValues(fields, function (field) {
      return {
        type: resolveType(field.type),
        args: mapValues(field.args, function (arg) {
          return GraphQLArgumentConfig(arg)
        }),
        resolve: field.resolve,
        deprecationReason: field.deprecationReason,
        description: field.description
      }
    })
  }

  //  create a GraphQLInterfacesThunk
  let GraphQLInterfacesThunk = function (interfaces) {
    if (!interfaces) return
    let thunk = without(map(interfaces, function (type) {
      let i = resolveType(type)
      if (i instanceof gql.GraphQLInterfaceType) return i
      else return null
    }), null)
    return (thunk.length > 0) ? () => thunk : undefined
  }

  //  create a InputObjectConfigFieldMapThunk
  let InputObjectConfigFieldMapThunk = function (fields) {
    if (!fields) return
    return () => mapValues(fields, function (field) {
      return InputObjectFieldConfig(field)
    })
  }

  //  create a GraphQLTypeThunk - not officially documented
  let GraphQLTypeThunk = function (types) {
    if (!types) return
    let thunk = without(map(types, function (t) {
      return resolveType(t)
    }), undefined)
    return (thunk.length > 0) ? () => thunk : undefined
  }

  //  create a GraphQLScalarType
  let GraphQLScalarType = function (objDef, objName) {
    return new gql.GraphQLScalarType({
      name: objDef.name || objName,
      description: objDef.description,
      serialize: isFunction(objDef.serialize) ? objDef.serialize : undefined,
      parseValue: isFunction(objDef.parseValue) ? objDef.parseValue : undefined,
      parseLiteral: objDef.parseValue() ? objDef.parseLiteral : undefined
    })
  }

  //  create a GraphQLObjectType
  let GraphQLObjectType = function (objDef, objName) {
    return new gql.GraphQLObjectType({
      name: objDef.name || objName,
      interfaces: GraphQLInterfacesThunk(objDef.interfaces),
      fields: GraphQLFieldConfigMapThunk(objDef.fields),
      isTypeOf: isFunction(objDef.isTypeOf) ? objDef.isTypeOf : undefined,
      description: objDef.description
    })
  }

  //  create a GraphQLInterfaceType
  let GraphQLInterfaceType = function (objDef, objName) {
    return new gql.GraphQLInterfaceType({
      name: objDef.name || objName,
      fields: () =>  GraphQLFieldConfigMapThunk(objDef.fields),
      resolveType: isFunction(objDef.resolveType) ? objDef.resolveType : undefined,
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
      fields: InputObjectConfigFieldMapThunk(objDef.fields),
      description: objDef.description
    })
  }

  //  create a GraphQLUnionType
  let GraphQLUnionType = function (objDef, objName) {
    return new gql.GraphQLUnionType({
      name: objDef.name || objName,
      types: GraphQLTypeThunk(objDef.types),
      resolveType: isFunction(objDef.resolveType) ? objDef.resolveType : undefined,
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

  return {
    resolveType,
    GraphQLSchema,
    GraphQLUnionType,
    GraphQLInputObjectType,
    GraphQLEnumType,
    GraphQLInterfaceType,
    GraphQLObjectType,
    GraphQLScalarType
  }
}

let _forEach = forEach

module.exports = function (gql) {
  let definitions = { types: {}, schemas: {} }
  let customTypes = {}
  let t = Types(gql, customTypes, definitions)

  //  register custom types
  let registerTypes = function (obj) {
    _forEach(obj, function (type, name) {
      customTypes[name] = type
    })
  }

  //  make all graphql objects
  let make = function (def) {

    let lib = {}

    //  build types first since schemas will use them
    _forEach(def.types, function (typeDef, typeName) {
      switch (typeDef.type) {
        case 'Enum':
          definitions.types[typeName] = t.GraphQLEnumType(typeDef, typeName)
          break
        case 'Input':
          definitions.types[typeName] = t.GraphQLInputObjectType(typeDef, typeName)
          break
        case 'Scalar':
          definitions.types[typeName] = t.GraphQLScalarType(typeDef, typeName)
          break
        case 'Interface':
          definitions.types[typeName] = t.GraphQLInterfaceType(typeDef, typeName)
          break
        case 'Union':
          definitions.types[typeName] = t.GraphQLUnionType(typeDef, typeName)
          break
        case 'Object':
          definitions.types[typeName] = t.GraphQLObjectType(typeDef, typeName)
          break
        default:
          definitions.types[typeName] = t.GraphQLObjectType(typeDef, typeName)
      }
    })

    //  build schemas
    _forEach(def.schemas, function (schemaDef, schemaName) {
      //  create a schema
      definitions.schemas[schemaName] = t.GraphQLSchema(schemaDef)

      //  create a function to execute the graphql schmea
      lib[schemaName] = function (query) {
        return gql.graphql(definitions.schemas[schemaName], query)
      }
    })
    lib._definitions = definitions
    return lib
  }
  return { make, registerTypes, utils }
}