'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
};

/* lodash like functions to remove dependency on lodash */

function isFunction(obj) {
  return typeof obj === 'function';
}
function isArray(obj) {
  return Array.isArray(obj);
}
function isDate(obj) {
  return obj instanceof Date;
}
function isObject(obj) {
  return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object';
}
function isHash(obj) {
  return isObject(obj) && !isArray(obj) && !isDate(obj) && obj !== null;
}
function includes(obj, key) {
  try {
    return isArray(obj) && obj.indexOf(key) !== -1;
  } catch (err) {
    return false;
  }
}
function has(obj, key) {
  try {
    return includes(Object.keys(obj), key);
  } catch (err) {
    return false;
  }
}
function forEach(obj, fn) {
  try {
    for (var key in obj) {
      if (fn(obj[key], key) === false) break;
    }
  } catch (err) {
    return;
  }
}
function without() {
  var output = [];
  var args = Array.prototype.slice.call(arguments);
  if (args.length === 0) return output;else if (args.length === 1) return args[0];
  var search = args.slice(1);
  forEach(args[0], function (val) {
    if (!includes(search, val)) output.push(val);
  });
  return output;
}
function map(obj, fn) {
  var output = [];
  try {
    for (var key in obj) {
      output.push(fn(obj[key], key));
    }
  } catch (err) {
    return [];
  }
  return output;
}
function mapValues(obj, fn) {
  var newObj = {};
  try {
    forEach(obj, function (v, k) {
      newObj[k] = fn(v);
    });
  } catch (err) {
    return obj;
  }
  return newObj;
}



var utils = Object.freeze({
  isFunction: isFunction,
  isArray: isArray,
  isDate: isDate,
  isObject: isObject,
  isHash: isHash,
  includes: includes,
  has: has,
  forEach: forEach,
  without: without,
  map: map,
  mapValues: mapValues
});

function Types(gql, customTypes, definitions) {

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
    var isObject = has(field, 'type');
    var type = isObject ? field.type : field;
    var isArray$$ = isArray(type);
    type = isArray$$ ? type[0] : type;

    if (has(definitions.types, type)) {
      type = definitions.types[type];
    } else if (has(typeMap, type)) {
      type = typeMap[type];
    } else if (has(customTypes, type)) {
      type = customTypes[type];
    } else if (has(gql, type)) {
      type = gql[type];
    }

    //  type modifiers for list and non-null
    type = isArray$$ ? new gql.GraphQLList(type) : type;
    type = isObject && (field.nullable === false || field.primary) ? new gql.GraphQLNonNull(type) : type;
    return type;
  };

  //  create a GraphQLArgumentConfig
  var GraphQLArgumentConfig = function GraphQLArgumentConfig(arg) {
    return {
      type: resolveType(arg),
      defaultValue: arg.defaultValue,
      description: arg.description
    };
  };

  //  create a InputObjectFieldConfig
  var InputObjectFieldConfig = function InputObjectFieldConfig(field) {
    return {
      type: resolveType(field),
      defaultValue: field.defaultValue,
      description: field.description
    };
  };

  //  create a GraphQLEnumValueConfig
  var GraphQLEnumValueConfig = function GraphQLEnumValueConfig(value) {
    if (!isObject(value)) return { value: value };
    return {
      value: value.value,
      deprecationReason: value.deprecationReason,
      description: value.description
    };
  };

  //  create a GraphQLEnumValueConfigMap
  var GraphQLEnumValueConfigMap = function GraphQLEnumValueConfigMap(values) {
    return mapValues(values, function (value) {
      return GraphQLEnumValueConfig(value);
    });
  };

  //  create a GraphQLFieldConfigMapThunk
  var GraphQLFieldConfigMapThunk = function GraphQLFieldConfigMapThunk(fields) {
    if (!fields) return;
    return function () {
      return mapValues(fields, function (field) {
        return {
          type: resolveType(field.type),
          args: mapValues(field.args, function (arg) {
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
    var thunk = without(map(interfaces, function (type) {
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
      return mapValues(fields, function (field) {
        return InputObjectFieldConfig(field);
      });
    };
  };

  //  create a GraphQLTypeThunk - not officially documented
  var GraphQLTypeThunk = function GraphQLTypeThunk(types) {
    if (!types) return;
    var thunk = without(map(types, function (t) {
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
      serialize: isFunction(objDef.serialize) ? objDef.serialize : undefined,
      parseValue: isFunction(objDef.parseValue) ? objDef.parseValue : undefined,
      parseLiteral: objDef.parseValue() ? objDef.parseLiteral : undefined
    });
  };

  //  create a GraphQLObjectType
  var GraphQLObjectType = function GraphQLObjectType(objDef, objName) {
    return new gql.GraphQLObjectType({
      name: objDef.name || objName,
      interfaces: GraphQLInterfacesThunk(objDef.interfaces),
      fields: GraphQLFieldConfigMapThunk(objDef.fields),
      isTypeOf: isFunction(objDef.isTypeOf) ? objDef.isTypeOf : undefined,
      description: objDef.description
    });
  };

  //  create a GraphQLInterfaceType
  var GraphQLInterfaceType = function GraphQLInterfaceType(objDef, objName) {
    return new gql.GraphQLInterfaceType({
      name: objDef.name || objName,
      fields: GraphQLFieldConfigMapThunk(objDef.fields),
      resolveType: isFunction(objDef.resolveType) ? objDef.resolveType : undefined,
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
      resolveType: isFunction(objDef.resolveType) ? objDef.resolveType : undefined,
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
}

var _forEach = forEach;

function index (gql) {
  var definitions = { types: {}, schemas: {} };
  var customTypes = {};
  var t = Types(gql, customTypes, definitions);

  //  register custom types
  var registerTypes = function registerTypes(obj) {
    _forEach(obj, function (type, name) {
      customTypes[name] = type;
    });
  };

  //  make all graphql objects
  var make = function make(def) {

    var lib = {};

    //  build types first since schemas will use them
    _forEach(def.types, function (typeDef, typeName) {
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
    _forEach(def.schemas, function (schemaDef, schemaName) {
      //  create a schema
      try {
        definitions.schemas[schemaName] = t.GraphQLSchema(schemaDef);

        //  create a function to execute the graphql schmea
        lib[schemaName] = function (query) {
          return gql.graphql(definitions.schemas[schemaName], query);
        };
      } catch (err) {
        console.log(err);
        return false;
      }
    });
    lib._definitions = definitions;
    return lib;
  };
  return { make: make, registerTypes: registerTypes, utils: utils };
}

module.exports = index;