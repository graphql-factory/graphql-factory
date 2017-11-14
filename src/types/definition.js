/**
 * The SchemaDefinition class enforces the structure of a
 * SchemaDefinitionConfig. It also provides chain-able methods that
 * allow programmatic configuration of a SchemaDefinitionConfig with
 * validation. The SchemaDefinitionConfig itself can be a plain
 * javascript object that follows the SchemaDefinitionConfig
 * specification.
 *
 * SchemaDefinitions are used to build a single Schema Definition
 * from various sources including Schema Language, GraphQL Factory
 * Definition (GFD) object, GraphQLSchema objects, GraphQLFactoryPlugin
 * objects, etc. All objects are deconstructed into a GFD and merged
 * into a single GFD. The combined GFD can be exported into a
 * Schema Definition Source and SchemaBacking object which can then
 * be used to generate a fully hydrated GraphQLSchema using the
 * custom buildSchema method included with GraphQL Factory
 *
 * @returns {boolean}
 * @flow
 */
import { SchemaBacking } from './backing';
import type { DirectiveLocationEnum } from 'graphql/type/directives';
import type { ObjMap } from 'graphql/jsutils/ObjMap'
import type { ValueNode } from 'graphql/language/ast';
import type {
  GraphQLFieldResolver,
  GraphQLIsTypeOfFn,
  GraphQLTypeResolver
} from 'graphql/type/definition';
import isHashLike from '../jsutils/isHashLike'


export class SchemaDefinition {
  _config: SchemaDefinitionConfig;

  constructor (config?: SchemaDefinitionConfig | SchemaDefinition) : void {
    let _config = config;
    if (config instanceof SchemaDefinition) {
      _config = definition._config;
    }
    _config = isHashLike(_config) ? _config : {}
    this._config = config
  }

  use (...args) {

  }
}

/**
 * Types
 * @type {{SCALAR: string, ENUM: string, OBJECT: string, INTERFACE: string, UNION: string, INPUT: string}}
 */
export const FactoryType = {
  SCALAR: 'Scalar',
  ENUM: 'Enum',
  OBJECT: 'Object',
  INTERFACE: 'Interface',
  UNION: 'Union',
  INPUT: 'Input'
};


export type FactoryScalarType = 'Scalar';
export type FactoryEnumType = 'Enum';
export type FactoryObjectType = 'Object';
export type FactoryInterfaceType = 'Interface';
export type FactoryUnionType = 'Union';
export type FactoryInputObjectType = 'Input';

export type FactoryTypeConfig = FactoryScalarTypeConfig |
  FactoryEnumTypeConfig | FactoryObjectTypeConfig |
  FactoryInterfaceTypeConfig | GraphQLUnionTypeConfig |
  FactoryInputObjectTypeConfig;

/**
 * Main SchemaDefinitionConfig
 */
export type SchemaDefinitionConfig = {
  backing?: ?SchemaBacking;
  context: ObjMap<mixed>;
  functions?: ?ObjMap<() => mixed>;
  directives?: ?ObjMap<FactoryDirectiveDefinitionConfig>;
  types?: ?ObjMap<FactoryTypeConfig>;
  schema?: ?SchemaTypeConfig;
};

/**
 * Argument Type
 */
export type FactoryArgumentConfig = {
  type: string;
  defaultValue?: mixed;
  description?: ?string;
  '@directives'?: ?FactoryDirectiveMap;
};

export type FactoryFieldConfigArgumentMap = ObjMap<FactoryArgumentConfig>;

/**
 * FieldConfig Type
 */
export type FactoryFieldConfig<TSource, TContext> = {
  type: string;
  args?: FactoryFieldConfigArgumentMap;
  resolve?: ?string | GraphQLFieldResolver<TSource, TContext>;
  // subscribe?: GraphQLFieldResolver<TSource, TContext>;
  deprecationReason?: ?string;
  description?: ?string;
  '@directives'?: ?FactoryDirectiveMap;
};

export type FactoryFieldConfigMap<TSource, TContext> =
  ObjMap<FactoryFieldConfig<TSource, TContext>>;

/**
 * Schema Type
 */
export type SchemaTypeConfig = {
  directives?: ?Array<string>;
  query: string;
  mutation?: ?string;
  subscription?: ?string;
  '@directives'?: ?FactoryDirectiveMap;
}

/**
 * Directive Type
 */
export type FactoryDirectiveDefinitionConfig = {
  name: string;
  description?: ?string;
  locations: Array<DirectiveLocationEnum>;
  args?: ?FactoryFieldConfigArgumentMap;
  resolveRequest?: ?GraphQLFieldResolver;
  resolveResult?: ?GraphQLFieldResolver;
  // TODO: determine if directives should have a directives field which acts like a dependency
};

export type FactoryDirectiveMap = ObjMap<mixed>;

/**
 * Enum Type
 */
export type FactoryEnumTypeConfig/* <T> */ = {
  type: FactoryEnumType;
  values: FactoryEnumValueConfigMap/* <T> */;
  description?: ?string;
  '@directives'?: ?FactoryDirectiveMap;
};

export type FactoryEnumValueConfigMap/* <T> */ =
  ObjMap<FactoryEnumValueConfig/* <T> */>;

export type FactoryEnumValueConfig = {
  value?: any/* T */;
  deprecationReason?: ?string;
  description?: ?string;
  '@directives'?: FactoryDirectiveMap;
};

/**
 * Scalar Type
 */
export type FactoryScalarTypeConfig<TInternal, TExternal> = {
  type: FactoryScalarType;
  description?: ?string;
  serialize: ?string | (value: mixed) => ?TExternal;
  parseValue?: ?string | (value: mixed) => ?TInternal;
  parseLiteral?: ?string | (valueNode: ValueNode) => ?TInternal;
  '@directives'?: ?FactoryDirectiveMap;
};

/**
 * Object Type
 */
export type FactoryObjectTypeConfig<TSource, TContext> = {
  type?: ?FactoryObjectType;
  interfaces?: ?Array<string>;
  fields: FactoryFieldConfigMap<TSource, TContext>;
  isTypeOf?: ?GraphQLIsTypeOfFn<TSource, TContext>;
  description?: ?string;
  '@directives'?: ?FactoryDirectiveMap;
};

/**
 * Interface Type
 */
export type FactoryInterfaceTypeConfig<TSource, TContext> = {
  type: FactoryInterfaceType;
  fields: FactoryFieldConfigMap<TSource, TContext>;
  resolveType?: ?GraphQLTypeResolver<TSource, TContext>;
  description?: ?string;
  '@directives'?: ?FactoryDirectiveMap;
};

/**
 * Union Type
 */
export type GraphQLUnionTypeConfig<TSource, TContext> = {
  type: FactoryUnionType,
  types: Array<string>,
  resolveType?: ?GraphQLTypeResolver<TSource, TContext>;
  description?: ?string;
  '@directives'?: ?FactoryDirectiveMap;
};

/**
 * Input type
 */
export type FactoryInputObjectTypeConfig = {
  type: FactoryInputObjectType;
  fields: FactoryInputFieldConfigMap;
  description?: ?string;
  '@directives'?: ?FactoryDirectiveMap;
};

export type FactoryInputFieldConfig = {
  type: string;
  defaultValue?: mixed;
  description?: ?string;
  '@directives'?: ?FactoryDirectiveMap;
};

export type FactoryInputFieldConfigMap =
  ObjMap<FactoryInputFieldConfig>;