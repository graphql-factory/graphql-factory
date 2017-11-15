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
import { assertObject } from '../jsutils/assertions';
import { SchemaBacking } from './backing';
import type { DirectiveLocationEnum } from 'graphql/type/directives';
import type { ObjMap } from 'graphql/jsutils/ObjMap';
import type { ValueNode } from 'graphql/language/ast';
import type {
  GraphQLFieldResolver,
  GraphQLIsTypeOfFn,
  GraphQLTypeResolver
} from 'graphql/type/definition';

export class SchemaDefinition {
  _config: ?SchemaDefinitionConfig;

  constructor(config: ?SchemaDefinitionConfig | ?SchemaDefinition): void {
    this._config = config instanceof SchemaDefinition ?
      config._config :
      config;
    this.assert();
  }

  use(...args: Array<mixed>) {
      return args;
  }

  /**
   * asserts that the definition is structured correctly
   * and fills in any missing values
   */
  assert() {
    const c = this._config || {};
    this._config = c;
    c.backing = new SchemaBacking(c.backing);

    if (c.context) {
      assertObject(
        c.context,
        'SchemaDefinition context must be an object'
      );
    } else {
      c.context = {};
    }

    if (c.functions) {
      assertObject(
        c.functions,
        'SchemaDefinition functions must be an object'
      );
    } else {
      c.functions = {};
    }

    if (c.directives) {
      assertObject(
        c.functions,
        'SchemaDefinition directives must be an object'
      );
    } else {
      c.directives = {};
    }

    if (c.types) {
      assertObject(
        c.types,
        'SchemaDefinition types must be an object'
      );
    } else {
      c.types = {};
    }

    if (!c.schema) {
      c.schema = null;
    }
  }
}

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
  backing?: ?SchemaBacking;
  context?: ?ObjMap<mixed>;
  functions: ObjMap<() => mixed>;
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

export type FactoryFieldConfigMap =
  ObjMap<FactoryFieldConfig>;

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
  resolveRequest?: ?GraphQLFieldResolver<*, *>;
  resolveResult?: ?GraphQLFieldResolver<*, *>;
  // TODO: determine if directives should have a directives 
  // field which acts like a dependency
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

export type FactoryInputFieldConfigMap =
  ObjMap<FactoryInputFieldConfig>;
