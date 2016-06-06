import _ from 'lodash'

export default function (gql) {
  let definitions = { types: {}, schemas: {} }
  let customTypes = {}

  let typeLib = function(gql, customTypes, definitions) {

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
      let isObject = _.has(field, 'type')
      let type = isObject ? field.type : field
      let isArray = _.isArray(type)
      type = isArray ? type[0] : type

      if (_.has(definitions.types, type)) {
        type = definitions.types[type]
      } else if (_.has(typeMap, type)) {
        type = typeMap[type]
      } else if (_.has(customTypes, type)) {
        type = customTypes[type]
      } else if (_.has(gql, type)) {
        type = gql[type]
      }

      //  type modifiers for list and non-null
      type = isArray ? new gql.GraphQLList(type) : type
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
      if (!_.isObject(value)) return { value: value }
      return {
        value: value.value,
        deprecationReason: value.deprecationReason,
        description: value.description
      }
    }

    //  create a GraphQLEnumValueConfigMap
    let GraphQLEnumValueConfigMap = function (values) {
      return _.mapValues(values, function (value) {
        return GraphQLEnumValueConfig(value)
      })
    }

    //  create a GraphQLFieldConfigMapThunk
    let GraphQLFieldConfigMapThunk = function (fields) {
      if (!fields) return
      return () => _.mapValues(fields, function (field) {
        return {
          type: resolveType(field.type),
          args: _.mapValues(field.args, function (arg) {
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
      let thunk = _.without(_.map(interfaces, function (type) {
        let i = resolveType(type)
        if (i instanceof gql.GraphQLInterfaceType) return i
        else return null
      }), null)
      return (thunk.length > 0) ? () => thunk : undefined
    }

    //  create a InputObjectConfigFieldMapThunk
    let InputObjectConfigFieldMapThunk = function (fields) {
      if (!fields) return
      return () => _.mapValues(fields, function (field) {
        return InputObjectFieldConfig(field)
      })
    }

    //  create a GraphQLTypeThunk - not officially documented
    let GraphQLTypeThunk = function (types) {
      if (!types) return
      let thunk = _.without(_.map(types, function (t) {
        return resolveType(t)
      }), undefined)
      return (thunk.length > 0) ? () => thunk : undefined
    }

    //  create a GraphQLScalarType
    let GraphQLScalarType = function (objDef, objName) {
      return new gql.GraphQLScalarType({
        name: objDef.name || objName,
        description: objDef.description,
        serialize: _.isFunction(objDef.serialize) ? objDef.serialize : undefined,
        parseValue: _.isFunction(objDef.parseValue) ? objDef.parseValue : undefined,
        parseLiteral: objDef.parseValue() ? objDef.parseLiteral : undefined
      })
    }

    //  create a GraphQLObjectType
    let GraphQLObjectType = function (objDef, objName) {
      return new gql.GraphQLObjectType({
        name: objDef.name || objName,
        interfaces: GraphQLInterfacesThunk(objDef.interfaces),
        fields: GraphQLFieldConfigMapThunk(objDef.fields),
        isTypeOf: _.isFunction(objDef.isTypeOf) ? objDef.isTypeOf : undefined,
        description: objDef.description
      })
    }

    //  create a GraphQLInterfaceType
    let GraphQLInterfaceType = function (objDef, objName) {
      return new gql.GraphQLInterfaceType({
        name: objDef.name || objName,
        fields: () =>  GraphQLFieldConfigMapThunk(objDef.fields),
        resolveType: _.isFunction(objDef.resolveType) ? objDef.resolveType : undefined,
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
        resolveType: _.isFunction(objDef.resolveType) ? objDef.resolveType : undefined,
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

  let t = typeLib(gql, customTypes, definitions)
  
  //  register custom types
  let registerTypes = function (obj) {
    _.forEach(obj, function (type, name) {
      customTypes[name] = type
    })
  }

  //  make all graphql objects
  let make = function (def) {

    let lib = {}

    //  build types first since schemas will use them
    _.forEach(def.types, function (typeDef, typeName) {
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
    _.forEach(def.schemas, function (schemaDef, schemaName) {
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

  return { make, registerTypes }
}