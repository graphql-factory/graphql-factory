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
  return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null;
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
function keys(obj) {
  try {
    return Object.keys(obj);
  } catch (err) {
    return [];
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

function get(obj, path, defaultValue) {
  var value = obj;
  var fields = isArray(path) ? path : [];
  if (isString(path)) {
    path = String(path);
    var open = false;
    var str = '';

    var addPath = function addPath(s, isOpen) {
      if (isNaN(s) && s.length > 0) fields.push(s);else if (!isNaN(s) && s.length > 0) fields.push(Number(s));
      open = isOpen;
      str = '';
    };

    //  parse the path
    for (var i in path) {
      var c = path[i];
      if (!isString(c)) continue;
      if (c === '[') addPath(str, true);else if (open && c === ']') addPath(str, false);else if (!open && c === '.') addPath(str, false);else str += c;
    }
    addPath(str, false);
  }

  //  loop though each field and attempt to get it
  for (var f in fields) {
    if (!value[fields[f]]) return defaultValue;else value = value[fields[f]];
  }
  return value;
}

function merge() {
  var args = Array.prototype.slice.call(arguments);
  if (args.length === 0) return {};else if (args.length === 1) return args[0];else if (!isHash(args[0])) return {};
  var targetObject = args[0];
  var sources = args.slice(1);

  //  define the recursive merge function
  var _merge = function _merge(target, source) {
    for (var k in source) {
      if (!target[k] && isHash(source[k])) {
        target[k] = _merge({}, source[k]);
      } else if (target[k] && isHash(target[k]) && isHash(source[k])) {
        target[k] = merge(target[k], source[k]);
      } else {
        if (isArray(source[k])) {
          target[k] = [];
          for (var x in source[k]) {
            if (isHash(source[k][x])) {
              target[k].push(_merge({}, source[k][x]));
            } else if (isArray(source[k][x])) {
              target[k].push(_merge([], source[k][x]));
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
    if (isHash(sources[k])) _merge(targetObject, sources[k]);
  }
  return targetObject;
}

/*
 * Gets the return type name of a query (returns shortened GraphQL primitive type names)
 */
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
  } catch (err) {
    console.error(err.message);
  }
}

/*
 * Returns the _typeConfig object of the schema operation (query/mutation)
 * Can be used to pass variables to resolve functions which use this function
 * to access those variables
 */
function getTypeConfig(info, path) {
  var _type = ['_', get(info, 'operation.operation'), 'Type'].join('');
  var pathArray = ['schema', _type, '_typeConfig'];
  if (path) pathArray.push(path);
  return get(info, pathArray.join('.'), {});
}



var utils = Object.freeze({
  isFunction: isFunction,
  isString: isString,
  isArray: isArray,
  isDate: isDate,
  isObject: isObject,
  isHash: isHash,
  includes: includes,
  keys: keys,
  has: has,
  forEach: forEach,
  without: without,
  map: map,
  mapValues: mapValues,
  filter: filter,
  omitBy: omitBy,
  pickBy: pickBy,
  get: get,
  merge: merge,
  getReturnTypeName: getReturnTypeName,
  getTypeConfig: getTypeConfig
});

function Types(gql, definitions) {

  //  primitive types
  var typeMap = {
    'String': gql.GraphQLString,
    'Int': gql.GraphQLInt,
    'Boolean': gql.GraphQLBoolean,
    'Float': gql.GraphQLFloat,
    'ID': gql.GraphQLID
  };

  //  used to return the function from definitions if a string key is provided
  var getFunction = function getFunction(fn) {
    if (!fn) return;
    fn = isString(fn) ? get(definitions.functions, fn) : fn;
    if (isFunction(fn)) return fn.bind(definitions);
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
    } else if (has(definitions.externalTypes, type)) {
      type = definitions.externalTypes[type];
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

  //  extend fields using a definition
  var extendFields = function extendFields(fields, exts) {
    var extKeys = [];
    var customProps = {};
    var defFields = definitions.definition.fields;
    fields = fields || {};

    //  check for valid extend config
    if (!exts || isArray(exts) && exts.length === 0 || isHash(exts) && keys(exts).length === 0 || !isString(exts) && !isHash(exts) && !isArray(exts)) return fields;

    //  get the bundle keys
    if (isString(exts)) extKeys = [exts];else if (isHash(exts)) extKeys = keys(exts);else if (isArray(exts)) extKeys = exts;

    //  merge bundles and existing fields
    var newFields = merge({}, fields);
    forEach(extKeys, function (v) {
      if (has(defFields, v)) {
        merge(newFields, defFields[v]);

        //  merge custom props
        if (isHash(exts) && isHash(exts[v])) merge(customProps, exts[v]);
      }
    });

    //  merge any custom props
    forEach(customProps, function (prop, name) {
      if (has(newFields, name)) merge(newFields[name], prop);
    });

    //  finally return the merged fields
    return newFields;
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
  var GraphQLFieldConfigMapThunk = function GraphQLFieldConfigMapThunk(fields, type, objDef) {
    fields = omitBy(extendFields(fields, objDef.extendFields), function (f) {
      return has(f, 'omitFrom') && (includes(f.omitFrom, type) || f.omitFrom === type);
    });
    if (!fields) return;
    return function () {
      return mapValues(fields, function (field) {
        field = !has(field, 'type') && has(field, type) ? field[type] : field;
        return {
          type: getType(field, type),
          args: mapValues(field.args, function (arg) {
            return GraphQLArgumentConfig(arg, type);
          }),
          resolve: getFunction(field.resolve),
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
  var InputObjectConfigFieldMapThunk = function InputObjectConfigFieldMapThunk(fields, type, objDef) {
    fields = omitBy(extendFields(fields, objDef.extendFields), function (f) {
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
      serialize: getFunction(objDef.serialize),
      parseValue: getFunction(objDef.parseValue),
      parseLiteral: getFunction(objDef.parseLiteral)
    });
  };

  //  create a GraphQLObjectType
  var GraphQLObjectType = function GraphQLObjectType(objDef, objName) {
    return new gql.GraphQLObjectType(merge({}, objDef, {
      name: objDef.name || objName,
      interfaces: GraphQLInterfacesThunk(objDef.interfaces),
      fields: GraphQLFieldConfigMapThunk(objDef.fields, 'Object', objDef),
      isTypeOf: getFunction(objDef.isTypeOf),
      description: objDef.description
    }));
  };

  //  create a GraphQLInterfaceType
  var GraphQLInterfaceType = function GraphQLInterfaceType(objDef, objName) {
    return new gql.GraphQLInterfaceType({
      name: objDef.name || objName,
      fields: GraphQLFieldConfigMapThunk(objDef.fields, 'Interface'),
      resolveType: getFunction(objDef.resolveType),
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
      fields: InputObjectConfigFieldMapThunk(objDef.fields, 'Input', objDef),
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
      resolveType: getFunction(objDef.resolveType),
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

var factory = function factory(gql) {
  var definitions = {
    globals: {},
    fields: {},
    functions: {},
    externalTypes: {},
    types: {},
    schemas: {}
  };
  var t = Types(gql, definitions);
  var typeFnMap = t.typeFnMap;

  //  register custom types
  var registerTypes = function registerTypes(obj) {
    Object.assign(definitions.externalTypes, obj);
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
    def.globals = def.globals || {};
    def.fields = def.fields || {};

    //  merge the externalTypes and functions before make
    Object.assign(definitions.externalTypes, def.externalTypes || {});
    Object.assign(definitions.functions, def.functions);

    //  add the globals and definition to the output
    definitions.globals = def.globals;
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
};

factory.utils = utils;

module.exports = factory;