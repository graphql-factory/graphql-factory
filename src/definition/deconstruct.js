/**
 * Deconstructs GraphQL types into Factory definitions
 * @flow
 */
import type { ObjMap } from 'graphql/jsutils/ObjMap';
import { ConflictResolution } from '../definition/const';
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
  GraphQLUnionType,
  GraphQLDirective
} from 'graphql';
import type {
  GraphQLType,
  ASTNode,
  GraphQLField,
  GraphQLArgument,
  GraphQLInputField,
  GraphQLEnumValueConfig
} from 'graphql';
import {
  lodash as _,
  forEach,
  reduce,
  stringMatch,
  setIf
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
 * Determines if an onConflict value is valid
 * @param {*} conflict 
 */
export function isConflictResolution(conflict: any) {
  return _.includes(_.values(ConflictResolution), conflict) ||
    _.isFunction(conflict);
}

/**
 * Parses an AST node for values
 * @param {*} astNode 
 */
export function parseASTNode(astNode: ASTNode) {
  const { kind } = astNode;
  const value = _.get(astNode, [ 'value' ]);
  const values = _.get(astNode, [ 'values' ]);
  const fields = _.get(astNode, [ 'filds' ]);
  switch (kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return value;
    case Kind.INT:
    case Kind.FLOAT:
      return Number(value);
    case Kind.OBJECT: {
      return reduce(fields, (val, field) => {
        val[field.name.value] = parseASTNode(field.value);
        return val;
      }, Object.create(null), true);
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
      }, Object.create(null), true);
      return config;
    }, Object.create(null), true);
  }
}

/**
 * Sets definition values based on key and validation
 * @param {*} def 
 * @param {*} key 
 * @param {*} value
 * @param {*} allowed
 */
export function setDef(
  def: any,
  key: string,
  value: any,
  allowed: Array<string>,
  object?: ?any
) {
  if (value !== undefined && allowed.indexOf(key) !== -1) {
    switch (key) {
      case 'args':
        const _args = reduce(value, (args, arg) => {
          const argDef = processArg(arg);
          args[argDef.name] = argDef.arg;
          return args;
        }, Object.create(null), true);
        setIf(def, key, _args, _.keys(_args).length);
        break;
      case 'astNode':
        const directives = extractDirectives(value);
        setIf(def, '@directives', directives, Boolean(directives));
        break;
      case 'interfaces':
        if (object instanceof GraphQLObjectType) {
          const interfaces = object.getInterfaces();
          if (interfaces.length) {
            def.interfaces = interfaces.map(({ name }) => name);
          }
        }
        break;
      case 'locations':
      case 'value':
      case 'deprecationReason':
      case 'defaultValue':
        def[key] = value;
        break;
      case 'description':
        setIf(def, key, value, stringMatch(value, true));
        break;
      case 'subscribe':
      case 'resolve':
        if (object instanceof GraphQLDirective) {
          setIf(def, key, value, _.isFunction(value));
        } else {
          const resolver = _.isFunction(_.get(value, '__resolver')) ?
          value.__resolver :
          value;
          setIf(def, key, resolver, _.isFunction(value));
        }
        break;
      case 'type':
        def[key] = processType(value);
        break;
      case 'isTypeOf':
      case 'serialize':
      case 'parseValue':
      case 'parseLiteral':
      case 'resolveResult':
      case 'beforeBuild':
        setIf(def, key, value, _.isFunction(value));
        break;
      case 'values':
        if (object instanceof GraphQLEnumType) {
          def[key] = reduce(object.getValues(), (valDef, val) => {
            valDef[val.name] = processEnumValue(val);
            return valDef;
          }, Object.create(null), true);
        }
        break;
      case 'onConflict':
        setIf(def, key, value, isConflictResolution(value));
        break;
      case 'types':
        if (object instanceof GraphQLUnionType) {
          def[key] = object.getTypes().map(({ name }) => name);
        }
        break;
      case 'fields':
        if (
          object instanceof GraphQLObjectType ||
          object instanceof GraphQLInterfaceType ||
          object instanceof GraphQLInputObjectType
        ) {
          def.fields = reduce(object.getFields(), (fields, field, name) => {
            fields[name] = object instanceof GraphQLInputObjectType ?
              processArg(field).arg :
              processField(field);
            return fields;
          }, Object.create(null), true);
        }
        break;
      case 'resolveType':
        setIf(
          def,
          key,
          value,
          _.isFunction(value) && value.name !== 'cannotExecuteSchema'
        );
        break;
      default:
        break;
    }
  }
  return def;
}

/**
 * Processes a GraphQLArgument into a FactoryArgumentConfig
 * @param {*} definition 
 */
export function processArg(definition: GraphQLArgument | GraphQLInputField) {
  const { name } = definition;
  const arg = reduce(definition, (def, value, key) => {
    return setDef(def, key, value, [
      'type',
      'defaultValue',
      'description',
      'astNode'
    ]);
  }, Object.create(null), true);
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
    return setDef(def, key, value, [
      'description',
      'value',
      'deprecationReason',
      'astNode'
    ]);
  }, Object.create(null), true);
}

/**
 * process a field into a definition
 * @param {*} definition 
 */
export function processField(definition: GraphQLField<*, *>) {
  return reduce(definition, (def, value, key) => {
    return setDef(def, key, value, [
      'description',
      'type',
      'args',
      'subscribe',
      'resolve',
      'deprecationReason',
      'astNode'
    ]);
  }, Object.create(null), true);
}

/**
 * Converts an object type to Factory definition
 * @param {*} object 
 */
function processObjectType(object: GraphQLObjectType) {
  return reduce(object._typeConfig, (def, value, key) => {
    return setDef(def, key, value, [
      'description',
      'interfaces',
      'fields',
      'isTypeOf',
      'astNode',
      'onConflict'
    ], object);
  }, { type: 'Object' }, true);
}

/**
 * Converts an object type to Factory definition
 * @param {*} object 
 */
function processInputObjectType(object: GraphQLInputObjectType) {
  return reduce(object._typeConfig, (def, value, key) => {
    return setDef(def, key, value, [
      'description',
      'fields',
      'astNode',
      'onConflict'
    ], object);
  }, { type: 'Input' }, true);
}

/**
 * Convert Scalar type to an Factory definition
 * @param {*} scalar 
 */
export function processScalarType(scalar: GraphQLScalarType) {
  return reduce(scalar._scalarConfig, (def, value, key) => {
    return setDef(def, key, value, [
      'description',
      'serialize',
      'parseValue',
      'parseLiteral',
      'astNode',
      'onConflict'
    ]);
  }, { type: 'Scalar' }, true);
}

/**
 * Processes a union into a factory definition
 * @param {*} union 
 */
export function processUnionType(union: GraphQLUnionType) {
  return reduce(union._typeConfig, (def, value, key) => {
    return setDef(def, key, value, [
      'description',
      'types',
      'resolveType',
      'astNode',
      'onConflict'
    ], union);
  }, { type: 'Union' }, true);
}

/**
 * Process an interface into a factory definition
 * @param {*} iface
 */
export function processInterfaceType(iface: GraphQLInterfaceType) {
  return reduce(iface._typeConfig, (def, value, key) => {
    return setDef(def, key, value, [
      'description',
      'fields',
      'resolveType',
      'astNode',
      'onConflict'
    ], iface);
  }, { type: 'Interface' }, true);
}

/**
 * Process an enum into a factory definition
 * @param {*} enu 
 */
export function processEnumType(enu: GraphQLEnumType) {
  return reduce(enu._enumConfig, (def, value, key) => {
    return setDef(def, key, value, [
      'description',
      'values',
      'astNode',
      'onConflict'
    ], enu);
  }, { type: 'Enum' }, true);
}

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
        setIf(
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
      setIf(
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
    const directives = extractDirectives(_.get(this.schema, [ 'astNode' ]));
    const customDirectives = this.schema.getDirectives()
      .filter(({ name }) => {
        return DefaultDirectives.indexOf(name) === -1;
      });
    setIf(
      this.definition.schema,
      'directives',
      customDirectives.map(dir => dir.name),
      customDirectives.length
    );
    setIf(
      this.definition.schema,
      'query',
      `${_prefix}${queryType.name}`,
      Boolean(queryType.name)
    );
    setIf(
      this.definition.schema,
      'mutation',
      `${_prefix}${mutationType.name}`,
      Boolean(mutationType.name)
    );
    setIf(
      this.definition.schema,
      'subscription',
      `${_prefix}${subscriptionType.name}`,
      Boolean(subscriptionType.name)
    );
    setIf(
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
      return setDef(def, key, value, [
        'description',
        'locations',
        'args',
        'resolve',
        'resolveResult',
        'beforeBuild',
        'astNode'
      ], directive);
    }, Object.create(null), true);
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
