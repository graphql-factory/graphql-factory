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
function isString(obj) {
  return typeof obj === 'string';
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
function filter(obj, fn) {
  var newObj = [];
  if (!isArray(obj)) return newObj;
  forEach(obj, function (v, k) {
    if (fn(v, k)) newObj.push(v);
  });
  return newObj;
}
function omitBy(obj, fn) {
  var newObj = {};
  if (!isHash(obj)) return newObj;
  forEach(obj, function (v, k) {
    if (!fn(v, k)) newObj[k] = v;
  });
  return newObj;
}
function pickBy(obj, fn) {
  var newObj = {};
  if (!isHash(obj)) return newObj;
  forEach(obj, function (v, k) {
    if (fn(v, k)) newObj[k] = v;
  });
  return newObj;
}
function mergeDeep() {
  var args = Array.prototype.slice.call(arguments);
  if (args.length === 0) return {};else if (args.length === 1) return args[0];else if (!isHash(args[0])) return {};
  var targetObject = args[0];
  var sources = args.slice(1);

  //  define the recursive merge function
  var merge = function merge(target, source) {
    for (var k in source) {
      if (!target[k] && isHash(source[k])) {
        target[k] = merge({}, source[k]);
      } else if (target[k] && isHash(target[k]) && isHash(source[k])) {
        target[k] = merge(target[k], source[k]);
      } else {
        if (isArray(source[k])) {
          target[k] = [];
          for (var x in source[k]) {
            if (isHash(source[k][x])) {
              target[k].push(merge({}, source[k][x]));
            } else if (isArray(source[k][x])) {
              target[k].push(merge([], source[k][x]));
            } else {
              target[k].push(source[k][x]);
            }
          }
        } else if (isDate(source[k])) {
          target[k] = new Date(source[k]);
        } else {
          target[k] = source[k];
        }
      }
    }
    return target;
  };

  //  merge each source
  for (var k in sources) {
    if (isHash(sources[k])) merge(targetObject, sources[k]);
  }
  return targetObject;
}

function getReturnTypeName(info) {
  try {
    var _type = ['_', info.operation.operation, 'Type'].join('');
    var o = info.schema[_type];
    var selections = info.operation.selectionSet.selections;
    var fieldName = selections[selections.length - 1].name.value;
    var fieldObj = o._fields[fieldName];
    var typeObj = fieldObj.type;
    while (!typeObj.name) {
      typeObj = typeObj.ofType;
      if (!typeObj) break;
    }
    return typeObj.name;
  } catch (err) {}
}



var utils = Object.freeze({
  isFunction: isFunction,
  isString: isString,
  isArray: isArray,
  isDate: isDate,
  isObject: isObject,
  isHash: isHash,
  includes: includes,
  has: has,
  forEach: forEach,
  without: without,
  map: map,
  mapValues: mapValues,
  filter: filter,
  omitBy: omitBy,
  pickBy: pickBy,
  mergeDeep: mergeDeep,
  getReturnTypeName: getReturnTypeName
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

  //  determines a field type given a FactoryTypeConfig
  var fieldType = function fieldType(field) {
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

  //  resolves the type from the schema, custom types, and graphql itself. supports conditional type
  var getType = function getType(field, rootType) {
    if (isHash(field) && !has(field, 'type') && has(field, rootType)) return fieldType(field[rootType]);
    return fieldType(field);
  };

  //  create a GraphQLArgumentConfig
  var GraphQLArgumentConfig = function GraphQLArgumentConfig(arg, type) {
    return {
      type: getType(arg, type),
      defaultValue: arg.defaultValue,
      description: arg.description
    };
  };

  //  create a InputObjectFieldConfig
  var InputObjectFieldConfig = function InputObjectFieldConfig(field, type) {
    return {
      type: getType(field, type),
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
  var GraphQLFieldConfigMapThunk = function GraphQLFieldConfigMapThunk(fields, type) {
    fields = omitBy(fields, function (f) {
      return has(f, 'omitFrom') && (includes(f.omitFrom, type) || f.omitFrom === type);
    });
    if (!fields) return;
    return function () {
      return mapValues(fields, function (field) {
        field = !has(field, 'type') && has(field, type) ? field[type] : field;
        var hasResolveFn = isFunction(field.resolve) && type === 'Object';
        return {
          type: getType(field, type),
          args: mapValues(field.args, function (arg) {
            return GraphQLArgumentConfig(arg, type);
          }),
          resolve: hasResolveFn ? field.resolve.bind(definitions) : undefined,
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
      var i = getType(type);
      if (i instanceof gql.GraphQLInterfaceType) return i;else return null;
    }), null);
    return thunk.length > 0 ? function () {
      return thunk;
    } : undefined;
  };

  //  create a InputObjectConfigFieldMapThunk
  var InputObjectConfigFieldMapThunk = function InputObjectConfigFieldMapThunk(fields, type) {
    fields = omitBy(fields, function (f) {
      return has(f, 'omitFrom') && (includes(f.omitFrom, type) || f.omitFrom === type);
    });
    if (!fields) return;
    return function () {
      return mapValues(fields, function (field) {
        return InputObjectFieldConfig(field, type);
      });
    };
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
      fields: GraphQLFieldConfigMapThunk(objDef.fields, 'Object'),
      isTypeOf: isFunction(objDef.isTypeOf) ? objDef.isTypeOf : undefined,
      description: objDef.description
    });
  };

  //  create a GraphQLInterfaceType
  var GraphQLInterfaceType = function GraphQLInterfaceType(objDef, objName) {
    return new gql.GraphQLInterfaceType({
      name: objDef.name || objName,
      fields: GraphQLFieldConfigMapThunk(objDef.fields, 'Interface'),
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
      fields: InputObjectConfigFieldMapThunk(objDef.fields, 'Input'),
      description: objDef.description
    });
  };

  //  create a GraphQLUnionType
  var GraphQLUnionType = function GraphQLUnionType(objDef, objName) {
    return new gql.GraphQLUnionType({
      name: objDef.name || objName,
      types: map(objDef.types, function (type) {
        return getType(type);
      }),
      resolveType: isFunction(objDef.resolveType) ? objDef.resolveType : undefined,
      description: objDef.description
    });
  };

  //  create a GraphQLSchema
  var GraphQLSchema = function GraphQLSchema(schema) {
    return new gql.GraphQLSchema({
      query: isString(schema.query) ? getType(schema.query) : GraphQLObjectType(schema.query, 'Query'),
      mutation: schema.mutation ? isString(schema.mutation) ? getType(schema.mutation) : GraphQLObjectType(schema.mutation, 'Mutation') : undefined
    });
  };

  //  type to function map
  var typeFnMap = {
    'Input': GraphQLInputObjectType,
    'Enum': GraphQLEnumType,
    'Interface': GraphQLInterfaceType,
    'Object': GraphQLObjectType,
    'Scalar': GraphQLScalarType
  };

  return {
    getType: getType,
    GraphQLSchema: GraphQLSchema,
    GraphQLUnionType: GraphQLUnionType,
    GraphQLInputObjectType: GraphQLInputObjectType,
    GraphQLEnumType: GraphQLEnumType,
    GraphQLInterfaceType: GraphQLInterfaceType,
    GraphQLObjectType: GraphQLObjectType,
    GraphQLScalarType: GraphQLScalarType,
    typeFnMap: typeFnMap
  };
}

function index (gql) {
  var definitions = { types: {}, schemas: {} };
  var customTypes = {};
  var t = Types(gql, customTypes, definitions);
  var typeFnMap = t.typeFnMap;

  //  register custom types
  var registerTypes = function registerTypes(obj) {
    forEach(obj, function (type, name) {
      customTypes[name] = type;
    });
  };

  //  check for valid types
  var validateType = function validateType(type) {
    if (!has(typeFnMap, type)) {
      throw 'InvalidTypeError: "' + type + '" is not a valid object type in the current context';
    }
  };

  //  construct a type name
  var makeTypeName = function makeTypeName(t, typeDef, typeName, nameOverride) {
    if (t == 'Object') return nameOverride || typeDef.name || typeName;else return nameOverride || (typeDef.name || typeName).concat(t);
  };

  //  add a hash type
  var addTypeHash = function addTypeHash(_types, type, typeDef, typeName) {
    forEach(type, function (tName, tType) {
      validateType(tType);
      _types[tType] = makeTypeName(tType, typeDef, typeName, tName);
    });
  };

  //  make all graphql objects
  var make = function make(def) {

    var lib = {};

    //  add the globals and definition to the output
    definitions.globals = def.globals || {};
    definitions.utils = utils;
    definitions.definition = omitBy(def, function (v, k) {
      return k === 'globals';
    });

    var nonUnionDefs = omitBy(def.types, function (tDef) {
      return tDef.type === 'Union';
    });
    var unionDefs = pickBy(def.types, function (tDef) {
      return tDef.type === 'Union';
    });

    //  build types first since schemas will use them, save UnionTypes for the end
    forEach(nonUnionDefs, function (typeDef, typeName) {

      var _types = {};

      //  default to object type
      if (!typeDef.type) typeDef.type = 'Object';

      //  if a single type is defined as a string
      if (isString(typeDef.type)) {

        //  validate the type and add it
        validateType(typeDef.type);
        _types[typeDef.type] = typeDef.name || typeName;
      } else if (isArray(typeDef.type)) {

        //  look at each type in the type definition array
        //  support the case [ String, { Type: Name } ] with defaults
        forEach(typeDef.type, function (t) {
          if (isString(t)) {
            validateType(t);
            _types[t] = makeTypeName(t, typeDef, typeName);
          } else if (isHash(t)) {
            addTypeHash(_types, t, typeDef, typeName);
          }
        });
      } else if (isHash(typeDef.type)) {
        addTypeHash(_types, typeDef.type, typeDef, typeName);
      }

      //  add the definitions
      forEach(_types, function (tName, tType) {
        definitions.types[tName] = typeFnMap[tType](typeDef, tName);
      });
    });

    //  add union definitions
    forEach(unionDefs, function (unionDef, unionName) {
      definitions.types[unionName] = t.GraphQLUnionType(unionDef, unionName);
    });

    //  build schemas
    forEach(def.schemas, function (schemaDef, schemaName) {
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