'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (gql) {
  var definitions = { types: {}, schemas: {} };
  var customTypes = {};

  var typeLib = function typeLib(gql, customTypes, definitions) {

    //  primitive types
    var typeMap = {
      'String': gql.GraphQLString,
      'Int': gql.GraphQLInt,
      'Boolean': gql.GraphQLBoolean,
      'Float': gql.GraphQLFloat,
      'ID': gql.GraphQLID
    };

    //  resolves the type from the schema, custom types, and graphql itself
    var resolveType = function resolveType(field) {
      var isObject = _lodash2.default.has(field, 'type');
      var type = isObject ? field.type : field;
      var isArray = _lodash2.default.isArray(type);
      type = isArray ? type[0] : type;

      if (_lodash2.default.has(definitions.types, type)) {
        type = definitions.types[type];
      } else if (_lodash2.default.has(typeMap, type)) {
        type = typeMap[type];
      } else if (_lodash2.default.has(customTypes, type)) {
        type = customTypes[type];
      } else if (_lodash2.default.has(gql, type)) {
        type = gql[type];
      }

      //  type modifiers for list and non-null
      type = isArray ? new gql.GraphQLList(type) : type;
      type = isObject && (field.nullable === false || field.primary) ? new gql.GraphQLNonNull(type) : type;
      return type;
    };

    //  create a GraphQLArgumentConfig
    var GraphQLArgumentConfig = function GraphQLArgumentConfig(arg) {
      return {
        type: resolveType(arg.type),
        defaultValue: arg.defaultValue,
        description: arg.description
      };
    };

    //  create a InputObjectFieldConfig
    var InputObjectFieldConfig = function InputObjectFieldConfig(field) {
      return {
        type: resolveType(field.type),
        defaultValue: field.defaultValue,
        description: field.description
      };
    };

    //  create a GraphQLEnumValueConfig
    var GraphQLEnumValueConfig = function GraphQLEnumValueConfig(value) {
      if (!_lodash2.default.isObject(value)) return { value: value };
      return {
        value: value.value,
        deprecationReason: value.deprecationReason,
        description: value.description
      };
    };

    //  create a GraphQLEnumValueConfigMap
    var GraphQLEnumValueConfigMap = function GraphQLEnumValueConfigMap(values) {
      return _lodash2.default.mapValues(values, function (value) {
        return GraphQLEnumValueConfig(value);
      });
    };

    //  create a GraphQLFieldConfigMapThunk
    var GraphQLFieldConfigMapThunk = function GraphQLFieldConfigMapThunk(fields) {
      if (!fields) return;
      return function () {
        return _lodash2.default.mapValues(fields, function (field) {
          return {
            type: resolveType(field.type),
            args: _lodash2.default.mapValues(field.args, function (arg) {
              return GraphQLArgumentConfig(arg);
            }),
            resolve: field.resolve,
            deprecationReason: field.deprecationReason,
            description: field.description
          };
        });
      };
    };

    //  create a GraphQLInterfacesThunk
    var GraphQLInterfacesThunk = function GraphQLInterfacesThunk(interfaces) {
      if (!interfaces) return;
      var thunk = _lodash2.default.without(_lodash2.default.map(interfaces, function (type) {
        var i = resolveType(type);
        if (i instanceof gql.GraphQLInterfaceType) return i;else return null;
      }), null);
      return thunk.length > 0 ? function () {
        return thunk;
      } : undefined;
    };

    //  create a InputObjectConfigFieldMapThunk
    var InputObjectConfigFieldMapThunk = function InputObjectConfigFieldMapThunk(fields) {
      if (!fields) return;
      return function () {
        return _lodash2.default.mapValues(fields, function (field) {
          return InputObjectFieldConfig(field);
        });
      };
    };

    //  create a GraphQLTypeThunk - not officially documented
    var GraphQLTypeThunk = function GraphQLTypeThunk(types) {
      if (!types) return;
      var thunk = _lodash2.default.without(_lodash2.default.map(types, function (t) {
        return resolveType(t);
      }), undefined);
      return thunk.length > 0 ? function () {
        return thunk;
      } : undefined;
    };

    //  create a GraphQLScalarType
    var GraphQLScalarType = function GraphQLScalarType(objDef, objName) {
      return new gql.GraphQLScalarType({
        name: objDef.name || objName,
        description: objDef.description,
        serialize: _lodash2.default.isFunction(objDef.serialize) ? objDef.serialize : undefined,
        parseValue: _lodash2.default.isFunction(objDef.parseValue) ? objDef.parseValue : undefined,
        parseLiteral: objDef.parseValue() ? objDef.parseLiteral : undefined
      });
    };

    //  create a GraphQLObjectType
    var GraphQLObjectType = function GraphQLObjectType(objDef, objName) {
      return new gql.GraphQLObjectType({
        name: objDef.name || objName,
        interfaces: GraphQLInterfacesThunk(objDef.interfaces),
        fields: GraphQLFieldConfigMapThunk(objDef.fields),
        isTypeOf: _lodash2.default.isFunction(objDef.isTypeOf) ? objDef.isTypeOf : undefined,
        description: objDef.description
      });
    };

    //  create a GraphQLInterfaceType
    var GraphQLInterfaceType = function GraphQLInterfaceType(objDef, objName) {
      return new gql.GraphQLInterfaceType({
        name: objDef.name || objName,
        fields: function fields() {
          return GraphQLFieldConfigMapThunk(objDef.fields);
        },
        resolveType: _lodash2.default.isFunction(objDef.resolveType) ? objDef.resolveType : undefined,
        description: objDef.description
      });
    };

    //  create a GraphQLEnumType
    var GraphQLEnumType = function GraphQLEnumType(objDef, objName) {
      return new gql.GraphQLEnumType({
        name: objDef.name || objName,
        values: GraphQLEnumValueConfigMap(objDef.values),
        description: objDef.description
      });
    };

    //  create a GraphQLInputObjectType
    var GraphQLInputObjectType = function GraphQLInputObjectType(objDef, objName) {
      return new gql.GraphQLInputObjectType({
        name: objDef.name || objName,
        fields: InputObjectConfigFieldMapThunk(objDef.fields),
        description: objDef.description
      });
    };

    //  create a GraphQLUnionType
    var GraphQLUnionType = function GraphQLUnionType(objDef, objName) {
      return new gql.GraphQLUnionType({
        name: objDef.name || objName,
        types: GraphQLTypeThunk(objDef.types),
        resolveType: _lodash2.default.isFunction(objDef.resolveType) ? objDef.resolveType : undefined,
        description: objDef.description
      });
    };

    //  create a GraphQLSchema
    var GraphQLSchema = function GraphQLSchema(schema) {
      return new gql.GraphQLSchema({
        query: GraphQLObjectType(schema.query, 'Query'),
        mutation: schema.mutation ? GraphQLObjectType(schema.mutation, 'Mutation') : undefined
      });
    };

    return {
      resolveType: resolveType,
      GraphQLSchema: GraphQLSchema,
      GraphQLUnionType: GraphQLUnionType,
      GraphQLInputObjectType: GraphQLInputObjectType,
      GraphQLEnumType: GraphQLEnumType,
      GraphQLInterfaceType: GraphQLInterfaceType,
      GraphQLObjectType: GraphQLObjectType,
      GraphQLScalarType: GraphQLScalarType
    };
  };

  var t = typeLib(gql, customTypes, definitions);

  //  register custom types
  var registerTypes = function registerTypes(obj) {
    _lodash2.default.forEach(obj, function (type, name) {
      customTypes[name] = type;
    });
  };

  //  make all graphql objects
  var make = function make(def) {

    var lib = {};

    //  build types first since schemas will use them
    _lodash2.default.forEach(def.types, function (typeDef, typeName) {
      switch (typeDef.type) {
        case 'Enum':
          definitions.types[typeName] = t.GraphQLEnumType(typeDef, typeName);
          break;
        case 'Input':
          definitions.types[typeName] = t.GraphQLInputObjectType(typeDef, typeName);
          break;
        case 'Scalar':
          definitions.types[typeName] = t.GraphQLScalarType(typeDef, typeName);
          break;
        case 'Interface':
          definitions.types[typeName] = t.GraphQLInterfaceType(typeDef, typeName);
          break;
        case 'Union':
          definitions.types[typeName] = t.GraphQLUnionType(typeDef, typeName);
          break;
        case 'Object':
          definitions.types[typeName] = t.GraphQLObjectType(typeDef, typeName);
          break;
        default:
          definitions.types[typeName] = t.GraphQLObjectType(typeDef, typeName);
      }
    });

    //  build schemas
    _lodash2.default.forEach(def.schemas, function (schemaDef, schemaName) {
      //  create a schema
      definitions.schemas[schemaName] = t.GraphQLSchema(schemaDef);

      //  create a function to execute the graphql schmea
      lib[schemaName] = function (query) {
        return gql.graphql(definitions.schemas[schemaName], query);
      };
    });
    lib._definitions = definitions;
    return lib;
  };

  return { make: make, registerTypes: registerTypes };
};

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }