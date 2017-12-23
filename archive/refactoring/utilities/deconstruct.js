/**
 * 
 * @flow
 */
import type { ObjMap } from 'graphql/jsutils/ObjMap';
import {
  Kind,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLList,
  GraphQLScalarType,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLUnionType
} from 'graphql';
import type {
  GraphQLType,
  ASTNode,
  GraphQLField,
  GraphQLArgument,
  GraphQLInputField,
  GraphQLDirective,
  GraphQLEnumValueConfig
} from 'graphql';
import {
  get,
  set,
  forEach,
  reduce
} from '../jsutils';

export const DefaultDirectives = [
  'skip',
  'include',
  'deprecated'
];

export const DefaultScalars = [
  'String',
  'Int',
  'Float',
  'ID',
  'Boolean'
];

/**
 * Parses an AST node for values
 * @param {*} astNode 
 */
export function parseASTNode(astNode: ASTNode) {
  const { kind } = astNode;
  const value = get(astNode, [ 'value' ]);
  const values = get(astNode, [ 'values' ]);
  const fields = get(astNode, [ 'filds' ]);
  switch (kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat();
    case Kind.OBJECT: {
      return reduce(fields, (val, field) => {
        val[field.name.value] = parseASTNode(field.value);
        return val;
      }, Object.create(null));
    }
    case Kind.LIST:
      return values.map(parseASTNode);
    default:
      return null;
  }
}

/**
 * Returns a schema language value for the type
 * @param {*} type 
 */
export function processType(type: GraphQLType) {
  return type instanceof GraphQLNonNull ?
    `${processType(type.ofType)}!` :
    type instanceof GraphQLList ?
      `[${processType(type.ofType)}]` :
      type.name;
}

/**
 * Creates a mapping of directive names to arguments
 * @param {*} node 
 */
export function extractDirectives(astNode: ASTNode) {
  if (!astNode) {
    return Object.create(null);
  } else if (Array.isArray(astNode.directives) && astNode.directives.length) {
    return reduce(astNode.directives, (config, ast) => {
      const { name: { value: name }, arguments: args } = ast;
      config[name] = reduce(args, (argDef, node) => {
        argDef[node.name.value] = parseASTNode(node.value);
        return argDef;
      }, Object.create(null));
      return config;
    }, Object.create(null));
  }
}

/**
 * Processes a GraphQLArgument into a FactoryArgumentConfig
 * @param {*} definition 
 */
export function processArg(definition: GraphQLArgument | GraphQLInputField) {
  const { name } = definition;
  const arg = reduce(definition, (def, value, key) => {
    if (value !== undefined) {
      switch (key) {
        case 'type':
          def[key] = processType(value);
          break;
        case 'defaultValue':
          def[key] = value;
          break;
        case 'description':
          set(def, key, value, (value !== ''));
          break;
        case 'astNode':
          const directives = extractDirectives(value);
          set(def, '@directives', directives, Boolean(directives));
          break;
        default:
          break;
      }
    }
    return def;
  }, Object.create(null));

  return { name, arg };
}

/**
 * Creates an enum value factory definition
 * @param {*} val 
 */
export function processEnumValue(
  val: GraphQLEnumValueConfig
) {
  return reduce(val, (def, value, key) => {
    if (value !== undefined) {
      switch (key) {
        case 'description':
          set(def, key, value, (value !== ''));
          break;
        case 'value':
        case 'deprecationReason':
          def[key] = value;
          break;
        case 'astNode':
          const directives = extractDirectives(value);
          set(def, '@directives', directives, Boolean(directives));
          break;
        default:
          break;
      }
    }
    return def;
  }, Object.create(null));
}

/**
 * process a field into a definition
 * @param {*} definition 
 */
export function processField(definition: GraphQLField<*, *>) {
  return reduce(definition, (def, value, key) => {
    if (value !== undefined) {
      switch (key) {
        case 'description':
          set(def, key, value, (value !== ''));
          break;
        case 'type':
          def[key] = processType(value);
          break;
        case 'args':
          def[key] = reduce(value, (args, arg) => {
            const argDef = processArg(arg);
            args[argDef.name] = argDef.arg;
            return args;
          }, Object.create(null));
          break;
        case 'subscribe':
          if (typeof value === 'function') {
            set(
              def,
              'subscribe',
              typeof value.__resolver === 'function' ?
                value.__resolver :
                value
            );
          }
          break;
        case 'resolve':
          if (typeof value === 'function') {
            set(
              def,
              'resolve',
              // check for a __resolver field which is set by factory
              // to preserve the original field resolver
              typeof value.__resolver === 'function' ?
                value.__resolver :
                value
            );
          }
          break;
        case 'deprecationReason':
          def[key] = value;
          break;
        case 'astNode':
          const directives = extractDirectives(value);
          set(def, '@directives', directives, Boolean(directives));
          break;
        default:
          break;
      }
    }
    return def;
  }, Object.create(null));
}

/**
 * Converts an object type to Factory definition
 * @param {*} object 
 */
function processObjectType(object: GraphQLObjectType) {
  return reduce(object._typeConfig, (def, value, key) => {
    if (value !== undefined) {
      switch (key) {
        case 'interfaces':
          const interfaces = object.getInterfaces();
          if (interfaces.length) {
            def.interfaces = interfaces.map(({ name }) => name);
          }
          break;
        case 'fields':
          def.fields = reduce(object.getFields(), (fields, field, name) => {
            fields[name] = processField(field);
            return fields;
          }, Object.create(null));
          break;
        case 'isTypeOf':
          set(def, key, value, (typeof value === 'function'));
          break;
        case 'description':
          set(def, key, value, (value !== ''));
          break;
        case 'astNode':
          const directives = extractDirectives(get(object, [ 'astNode' ]));
          set(def, '@directives', directives, Boolean(directives));
          break;
        default:
          break;
      }
    }
    return def;
  }, {
    type: 'Object'
  });
}

/**
 * Converts an object type to Factory definition
 * @param {*} object 
 */
function processInputObjectType(object: GraphQLInputObjectType) {
  return reduce(object._typeConfig, (def, value, key) => {
    if (value !== undefined) {
      switch (key) {
        case 'fields':
          def.fields = reduce(object.getFields(), (fields, field, name) => {
            fields[name] = processArg(field).arg;
            return fields;
          }, Object.create(null));
          break;
        case 'description':
          set(def, key, value, (value !== ''));
          break;
        case 'astNode':
          const directives = extractDirectives(get(object, [ 'astNode' ]));
          set(def, '@directives', directives, Boolean(directives));
          break;
        default:
          break;
      }
    }
    return def;
  }, {
    type: 'Input'
  });
}

/**
 * Convert Scalar type to an Factory definition
 * @param {*} scalar 
 */
export function processScalarType(scalar: GraphQLScalarType) {
  return reduce(scalar._scalarConfig, (def, value, key) => {
    if (value !== undefined) {
      switch (key) {
        case 'description':
          set(def, key, value, (value !== ''));
          break;
        case 'serialize':
          set(def, key, value, (typeof value === 'function'));
          break;
        case 'parseValue':
          set(def, key, value, (typeof value === 'function'));
          break;
        case 'parseLiteral':
          set(def, key, value, (typeof value === 'function'));
          break;
        case 'astNode':
          const directives = extractDirectives(get(scalar, [ 'astNode' ]));
          set(def, '@directives', directives, Boolean(directives));
          break;
        default:
          break;
      }
    }
    return def;
  }, {
    type: 'Scalar'
  });
}

/**
 * Processes a union into a factory definition
 * @param {*} union 
 */
export function processUnionType(union: GraphQLUnionType) {
  return reduce(union._typeConfig, (def, value, key) => {
    if (value !== undefined) {
      switch (key) {
        case 'types':
          def[key] = union.getTypes().map(({ name }) => name);
          break;
        case 'resolveType':
          set(
            def,
            key,
            value,
            (
              typeof value === 'function' &&
              value.name !== 'cannotExecuteSchema'
            )
          );
          break;
        case 'description':
          set(def, key, value, (value !== ''));
          break;
        case 'astNode':
          const directives = extractDirectives(get(union, [ 'astNode' ]));
          set(def, '@directives', directives, Boolean(directives));
          break;
        default:
          break;
      }
    }
    return def;
  }, {
    type: 'Union'
  });
}

/**
 * Process an interface into a factory definition
 * @param {*} iface
 */
export function processInterfaceType(iface: GraphQLInterfaceType) {
  return reduce(iface._typeConfig, (def, value, key) => {
    if (value !== undefined) {
      switch (key) {
        case 'fields':
          def.fields = reduce(iface.getFields(), (fields, field, name) => {
            fields[name] = processField(field);
            return fields;
          }, Object.create(null));
          break;
        case 'resolveType':
          set(
            def,
            key,
            value,
            (
              typeof value === 'function' &&
              value.name !== 'cannotExecuteSchema'
            )
          );
          break;
        case 'description':
          set(def, key, value, (value !== ''));
          break;
        case 'astNode':
          const directives = extractDirectives(get(iface, [ 'astNode' ]));
          set(def, '@directives', directives, Boolean(directives));
          break;
        default:
            break;
      }
    }
    return def;
  }, {
    type: 'Interface'
  });
}

/**
 * Process an enum into a factory definition
 * @param {*} enu 
 */
export function processEnumType(enu: GraphQLEnumType) {
  return reduce(enu._enumConfig, (def, value, key) => {
    if (value !== undefined) {
      switch (key) {
        case 'values':
          def[key] = reduce(enu.getValues(), (valDef, val) => {
            valDef[val.name] = processEnumValue(val);
            return valDef;
          }, Object.create(null));
          break;
        case 'description':
          set(def, key, value, (value !== ''));
          break;
        case 'astNode':
          const directives = extractDirectives(value);
          set(def, '@directives', directives, Boolean(directives));
          break;
        default:
          break;
      }
    }
    return def;
  }, {
    type: 'Enum'
  });
}

export type FactoryDirectiveMap = {
  [directiveName: string]: ?ObjMap<?mixed>
};

export type FactorySchemaDefinitionConfig = {
  directives?: ?FactoryDirectiveMap,
  query: string,
  mutation?: ?string,
  subscription?: ?string
};

export type FactoryDefinitionConfig = {
  directives?: { [name: ?string]: ?mixed },
  types: { [name: ?string]: ?mixed },
  schema: FactorySchemaDefinitionConfig
};

export class SchemaDeconstructor {
  schema: GraphQLSchema;
  definition: FactoryDefinitionConfig;

  constructor(schema: GraphQLSchema) {
    this.schema = schema;
    this.definition = {
      types: {},
      schema: {
        query: ''
      }
    };
  }

  /**
   * Converts user defined types to definitions
   */
  processTypes(prefix?: ?string) {
    const _prefix = typeof prefix === 'string' ? prefix : '';
    forEach(this.schema.getTypeMap(), (type, name) => {
      // determine if the type can be processed
      // it should not be prefixed with __ or be a known
      // default scalar type
      if (!name.match(/^__/) && DefaultScalars.indexOf(name) === -1) {
        const definition = deconstructType(type);
        set(
          this.definition.types,
          [ `${_prefix}${name}` ],
          definition,
          Boolean(definition)
        );
      }
    });
    return this;
  }

  /**
   * Converts the schema directives into FactoryDirectiveConfigs
   */
  processDirectives() {
    forEach(this.schema.getDirectives(), directive => {
      const { name } = directive;
      const definition = deconstructDirective(directive);
      set(
        this.definition,
        [ 'directives', name ],
        definition,
        Boolean(definition)
      );
    });
    return this;
  }

  /**
   * Creates a factory schema config from the root types
   */
  processSchema(prefix?: ?string) {
    const _prefix = typeof prefix === 'string' ? prefix : '';
    const queryType = this.schema.getQueryType() || {};
    const mutationType = this.schema.getMutationType() || {};
    const subscriptionType = this.schema.getSubscriptionType() || {};
    const directives = extractDirectives(get(this.schema, [ 'astNode' ]));
    const customDirectives = this.schema.getDirectives()
      .filter(({ name }) => {
        return [ 'skip', 'include', 'deprecated' ].indexOf(name) === -1;
      });
    set(
      this.definition.schema,
      'directives',
      customDirectives.map(dir => dir.name),
      customDirectives.length
    );
    set(
      this.definition.schema,
      'query',
      `${_prefix}${queryType.name}`,
      Boolean(queryType.name)
    );
    set(
      this.definition.schema,
      'mutation',
      `${_prefix}${mutationType.name}`,
      Boolean(mutationType.name)
    );
    set(
      this.definition.schema,
      'subscription',
      `${_prefix}${subscriptionType.name}`,
      Boolean(subscriptionType.name)
    );
    set(
      this.definition.schema,
      '@directives',
      directives,
      Boolean(directives)
    );
    return this;
  }

  /**
   * Deconstructs a schema into a factory definition
   */
  deconstruct(prefix?: ?string) {
    return this
      .processSchema(prefix)
      .processDirectives()
      .processTypes(prefix)
      .definition;
  }
}

/**
 * Determines the type do deconstruct and uses the
 * appropriate deconstruction method
 * @param {*} type 
 */
export function deconstructType(type: GraphQLType) {
  if (type instanceof GraphQLObjectType) {
    return processObjectType(type);
  } else if (type instanceof GraphQLScalarType) {
    return processScalarType(type);
  } else if (type instanceof GraphQLEnumType) {
    return processEnumType(type);
  } else if (type instanceof GraphQLInputObjectType) {
    return processInputObjectType(type);
  } else if (type instanceof GraphQLUnionType) {
    return processUnionType(type);
  } else if (type instanceof GraphQLInterfaceType) {
    return processInterfaceType(type);
  }
  throw new Error('Type deconstruction can only be performed on' +
    'GraphQL Object, Scalar, Enum, Input, Union, and Interface types');
}

/**
 * Deconstructs a GraphQLDirective into a FactoryDirectiveConfig
 * @param {*} directive 
 */
export function deconstructDirective(directive: GraphQLDirective) {
  const { name } = directive;
  if (DefaultDirectives.indexOf(name) === -1) {
    return reduce(directive, (def, value, key) => {
      if (value !== undefined) {
        switch (key) {
          case 'description':
            set(def, key, value, (value !== ''));
            break;
          case 'locations':
            def[key] = value;
            break;
          case 'args':
            def[key] = reduce(value, (args, arg) => {
              const argDef = processArg(arg);
              args[argDef.name] = argDef.arg;
              return args;
            }, Object.create(null));
            break;
          case 'resolve':
            set(def, key, value, (typeof value === 'function'));
            break;
          case 'resolveResult':
            set(def, key, value, (typeof value === 'function'));
            break;
          case 'beforeBuild':
            set(def, key, value, (typeof value === 'function'));
            break;
          case 'astNode':
            const directives = extractDirectives(value);
            set(def, '@directives', directives, Boolean(directives));
            break;
          default:
            break;
        }
      }
      return def;
    }, Object.create(null));
  }
}

/**
 * Deconstructs a schema into types, directives, and schema
 * @param {*} schema 
 */
export function deconstructSchema(
  schema: GraphQLSchema,
  prefix?: ?string
) {
  return new SchemaDeconstructor(schema)
    .deconstruct(prefix);
}
