/**
 * 
 * @flow
 */
import {
  Kind,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLList,
  GraphQLType,
  GraphQLScalarType,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLUnionType
} from '../types/graphql';
import type {
  ObjMap,
  ASTNode,
  GraphQLField,
  GraphQLArgument,
  GraphQLDirective,
  ArgumentNode
} from '../types/graphql.js';
import {
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
  const { kind, value, values, fields } = astNode
  switch (kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(value);
    case Kind.OBJECT: {
      return reduce(fields, (value, field) => {
        value[field.name.value] = parseASTNode(field.value);
        return value;
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
export function extractDirectives(node: ASTNode) {
  if (Array.isArray(node.directives) && node.directives.length) {
    return reduce(node.directives, (config, ast) => {
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
export function processArg(definition: GraphQLArgument) {
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
          set(def, 'directives', directives, !!directives);
          break;
        default:
          break;
      }
    }
    return def;
  }, Object.create(null));

  return { name, arg };
}

export function processField(definition: GraphQLField) {
  const { name } = definition;
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
        case 'resolve':
          set(def, 'resolve', value, (typeof value === 'function'));
          break;
        case 'deprecationReason':
          def[key] = value;
          break;
        case 'astNode':
          const directives = extractDirectives(value);
          set(def, 'directives', directives, !!directives);
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
function processObjectType(object) {
  return reduce(object, (def, value, key) => {
    if (value !== undefined) {
      switch (key) {
        case '_interfaces':
          const interfaces = object.getInterfaces();
          if (interfaces.length) {
            def.interfaces = interfaces.map(({ name }) => name);
          }
          break;
        case '_fields':
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
          const directives = extractDirectives(value);
          set(def, 'directives', directives, !!directives);
        default:
          break;
      }
    }
    return def;
  }, {
    type: 'Object'
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

  constructor (schema: GraphQLSchema) {
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
  processTypes() {
    forEach(this.schema.getTypeMap(), (type, name) => {
      // determine if the type can be processed
      // it should not be prefixed with __ or be a known
      // default scalar type
      if (!name.match(/^__/) && DefaultScalars.indexOf(name) === -1) {
        const definition = deconstructType(type);
        set(this.definition.types, [ name ], definition, !!definition);
      }
    })
    return this;
  }

  /**
   * Converts the schema directives into FactoryDirectiveConfigs
   */
  processDirectives() {
    forEach(this.schema.getDirectives(), directive => {
      const { name } = directive;
      const definition = deconstructDirective(directive);
      set(this.definition, [ 'directives', name ], definition, !!definition);
    });
    return this;
  }

  /**
   * Creates a factory schema config from the root types
   */
  processSchema() {
    const queryType = this.schema.getQueryType() || {};
    const mutationType = this.schema.getMutationType() || {};
    const subscriptionType = this.schema.getSubscriptionType() || {};
    const directives = extractDirectives(this.schema.astNode);
    this.definition.schema.query = queryType.name;
    set(
      this.definition.schema,
      'mutation',
      mutationType.name,
      !!mutationType.name
    );
    set(
      this.definition.schema,
      'subscription',
      subscriptionType.name,
      !!subscriptionType.name
    );
    set(
      this.definition.schema,
      'directives',
      directives,
      !!directives
    );
    return this;
  }

  /**
   * Deconstructs a schema into a factory definition
   */
  deconstruct() {
    return this
      .processSchema()
      .processDirectives()
      .processTypes()
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

  } else if (type instanceof GraphQLEnumType) {
    
  } else if (type instanceof GraphQLInputObjectType) {
    
  } else if (type instanceof GraphQLUnionType) {

  } else if (type instanceof GraphQLInterfaceType) {

  } else {
    throw new Error('Type deconstruction can only be performed on' +
      'GraphQL Object, Scalar, Enum, Input, Union, and Interface types')
  }
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
          case 'astNode':
            const directives = extractDirectives(value);
            set(def, 'directives', directives, !!directives);
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
export function deconstructSchema(schema: GraphQLSchema) {
  return new SchemaDeconstructor(schema).deconstruct();
}