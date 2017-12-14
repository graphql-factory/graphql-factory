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
 * @flow
 */
import EventEmitter from 'events';
import type { ObjMap } from 'graphql/jsutils/ObjMap';
import type { GraphQLFieldResolver } from 'graphql';

export const DEFINITION_VERSION = '3.0.0';

export class SchemaDefinition extends EventEmitter {
  _context: ObjMap<any>;
  _functions: ObjMap<?() => any>;
  _directives: ObjMap<?FactoryDirectiveConfig>;
  _types: ObjMap<?FactoryTypeConfig>;
  _schema: ?SchemaTypeConfig;

  constructor() {
    super();
    this._context = {};
    this._functions = {};
    this._directives = {};
    this._types = {};
    this._schema = null;
  }

  use() {

  }

  merge() {

  }

  fix() {

  }

  validate() {

  }

  export() {

  }

  buildSchema() {

  }

  get context(): ?ObjMap<any> {
    return this._context;
  }

  get functions(): ?ObjMap<?() => any> {
    return this._functions;
  }

  get directives(): ?ObjMap<FactoryDirectiveConfig> {
    return this._directives;
  }

  get types(): ?ObjMap<FactoryTypeConfig> {
    return this._types;
  }

  get schema(): ?SchemaTypeConfig {
    return this._schema;
  }
  get version(): string {
    return DEFINITION_VERSION;
  }
}

/**
 * FlowType definitions
 */
export type SchemaTypeConfig = {
  directives?: ?Array<string>,
  query: string,
  mutation?: ?string,
  subscription?: ?string,
  '@directives'?: ?FactoryDirectiveAttachConfig
};

export type FactoryDirectiveConfig = {
  description?: ?string,
  locations: Array<string>,
  args?: ?FactoryFieldConfigArgumentMap,
  resolve?: ?GraphQLFieldResolver<*, *>,
  resolveResult?: ?GraphQLFieldResolver<*, *>,
  beforeBuild?: ?() => any
};


// TODO: fully define these
export type FactoryFieldConfigArgumentMap = ObjMap<?mixed>;
export type FactoryDirectiveAttachConfig = ObjMap<?mixed>;
export type FactoryTypeConfig = ObjMap<?mixed>;
export type FactoryDirectiveMap = ObjMap<mixed>;

