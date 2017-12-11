/**
 * @flow
 */
import { GraphQLSchema } from 'graphql';
import { SchemaDefinition } from './definition';
import type { ObjMap } from 'graphql/jsutils/ObjMap';
import type {
  GraphQLFieldResolver,
  GraphQLIsTypeOfFn,
  GraphQLTypeResolver,
  DirectiveLocationEnum,
  ValueNode
} from 'graphql';

export type UseArgument = string |
  SchemaDefinitionConfig |
  SchemaDefinition |
  GraphQLSchema;

/**
* Types
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

export type FactoryTypeConfig =
  FactoryScalarTypeConfig |
  FactoryEnumTypeConfig |
  FactoryObjectTypeConfig |
  FactoryInterfaceTypeConfig |
  GraphQLUnionTypeConfig |
  FactoryInputObjectTypeConfig;

/**
* Main SchemaDefinitionConfig
*/
export type SchemaDefinitionConfig = {
  context?: ?ObjMap<?mixed>;
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
export type FactoryFieldConfig = {
  type: string;
  args?: FactoryFieldConfigArgumentMap;
  resolve?: ?string | GraphQLFieldResolver<*, *>;
  // subscribe?: GraphQLFieldResolver<TSource, TContext>;
  deprecationReason?: ?string;
  description?: ?string;
  '@directives'?: ?FactoryDirectiveMap;
};

export type FactoryFieldConfigMap = ObjMap<FactoryFieldConfig>;

/**
* Schema Type
*/
export type SchemaTypeConfig = {
  directives?: ?Array<string>;
  query: string;
  mutation?: ?string;
  subscription?: ?string;
  '@directives'?: ?FactoryDirectiveMap;
};

/**
* Directive Type
*/
export type FactoryDirectiveDefinitionConfig = {
  name: string;
  description?: ?string;
  locations: Array<DirectiveLocationEnum>;
  args?: ?FactoryFieldConfigArgumentMap;
  resolve?: ?GraphQLFieldResolver<*, *>;
  resolveResult?: ?GraphQLFieldResolver<*, *>;
  beforeBuild?:?() => ?mixed;
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
export type FactoryScalarTypeConfig = {
  type: FactoryScalarType;
  description?: ?string;
  serialize: ?string | (value: mixed) => ?mixed;
  parseValue?: ?string | (value: mixed) => ?mixed;
  parseLiteral?: ?string | (valueNode: ValueNode) => ?mixed;
  '@directives'?: ?FactoryDirectiveMap;
};

/**
* Object Type
*/
export type FactoryObjectTypeConfig = {
  type?: ?FactoryObjectType;
  interfaces?: ?Array<string>;
  fields: FactoryFieldConfigMap;
  isTypeOf?: ?GraphQLIsTypeOfFn<*, *>;
  description?: ?string;
  '@directives'?: ?FactoryDirectiveMap;
};

/**
* Interface Type
*/
export type FactoryInterfaceTypeConfig = {
  type: FactoryInterfaceType;
  fields: FactoryFieldConfigMap;
  resolveType?: ?GraphQLTypeResolver<*, *>;
  description?: ?string;
  '@directives'?: ?FactoryDirectiveMap;
};

/**
* Union Type
*/
export type GraphQLUnionTypeConfig = {
  type: FactoryUnionType,
  types: Array<string>,
  resolveType?: ?GraphQLTypeResolver<*, *>;
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

export type FactoryInputFieldConfigMap = ObjMap<FactoryInputFieldConfig>;
