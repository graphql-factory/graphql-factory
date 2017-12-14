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
import { GraphQLSchema, GraphQLDirective } from 'graphql';
import { JSONType, DateTimeType, GraphQLFactoryPlugin } from '../types';
import { SchemaBacking } from './backing';
import { fixDefinition } from './fix';
import { mergeDefinition } from './merge';
import { printDefinition } from '../utilities';
import { lodash as _, stringMatch, asrt } from '../jsutils';
import { DEFINITION_FIELDS } from './const';
import {
  useLanguage,
  useSchema,
  useDirective,
  usePlugin,
  useBacking
} from './use';

export const DEFINITION_VERSION = '3.0.0';

/**
 * Assert with SchemaDefinitionErrors
 * @param {*} condition 
 * @param {*} message 
 * @param {*} metadata 
 */
function assert(condition, message, metadata) {
  return asrt('definition', condition, message, metadata);
}

/**
 * Determines if the object has one or more definition keys
 * @param {*} obj 
 */
function isDefinitionLike(obj) {
  return _.intersection(_.keys(obj), DEFINITION_FIELDS).length > 0;
}

export class SchemaDefinition extends EventEmitter {
  _options: ObjMap<any>;
  _context: ObjMap<any>;
  _functions: ObjMap<?() => any>;
  _directives: ObjMap<?FactoryDirectiveConfig>;
  _types: ObjMap<?FactoryTypeConfig>;
  _schema: ?SchemaTypeConfig;

  constructor(options?: ?SchemaDefinitionOptions) {
    super();
    this._options = Object.assign({}, options);
    this._context = {};
    this._functions = {};
    this._directives = {};
    this._types = this._options.noDefaultTypes !== true ?
      { DateTime: DateTimeType, JSON: JSONType } :
      {};
    this._schema = null;
  }

  /**
   * Adds definition configuration from various sources
   * @param {*} args 
   */
  use(...args: Array<any>) {
    const [ arg0, arg1, arg2 ] = args;

    // .use(SchemaDefinition)
    if (arg0 instanceof SchemaDefinition) {
      return this.merge(arg0);
    }

    // .use(SchemaBacking)
    if (arg0 instanceof SchemaBacking) {
      return useBacking.call(this, arg0);
    }

    // .use(GraphQLSchema [, namePrefix])
    if (arg0 instanceof GraphQLSchema) {
      return useSchema.call(this, arg0, arg1);
    }

    // .use(GraphQLDirective)
    if (arg0 instanceof GraphQLDirective) {
      return useDirective.call(this, arg0);
    }

    // .use(GraphQLType) ??? should this be supported

    // .use(GraphFactoryPlugin)
    if (arg0 instanceof GraphQLFactoryPlugin) {
      return usePlugin.call(this, arg0);
    }

    // .use(languageDefinition [, SchemaBacking] [, namePrefix])
    if (stringMatch(arg0, true)) {
      return useLanguage.call(this, arg0, arg1, arg2);
    }

    // .use(function, name)
    if (_.isFunction(arg0)) {
      assert(stringMatch(arg1, true), 'function name required');
      return this.merge(_.set({}, [ 'functions', arg1 ], arg0));
    }

    // .use(SchemaDefinitionConfig)
    if (isDefinitionLike(arg0)) {
      return this.merge(arg0);
    }

    // throw error if no conditions matched
    assert(false, 'invalid use arguments');
  }

  /**
   * Merges a SchemaDefinition or definition like object
   * @param {*} definition 
   */
  merge(definition: any) {
    return mergeDefinition.call(this, definition);
  }

  /**
   * Validates the current definition
   */
  validate() {
    return this;
  }

  /**
   * Exports the definition as a SchemaLanguage and backing
   */
  export() {
    fixDefinition(this).validate();
    return {
      definition: printDefinition(this),
      backing: new SchemaBacking().import(this)
    };
  }

  /**
   * Builds an executable schema from the current definition
   * 
   * Options
   *   * [useMiddleware=true]: wrap each resolver in middleware
   *   * [factoryExecution=true]: uses custom graphql-factory execution
   *                              which takes over the resolvers
   */
  buildSchema(options?: ?ObjMap<?mixed>) {
    const opts = Object.assign({}, options);
    const wrap = opts.useMiddleware !== false;
    /*
    const opts = typeof options === 'object' && options !== null ?
      options :
      Object.create(null);

    // option to bypass middleware wraping
    const wrap = opts.useMiddleware !== false;

    // create the schema
    const { definition, backing } = this.export(opts);
    const schema = buildSchema(definition, backing);
    set(schema, 'definition', this);
    return wrap ? wrapMiddleware(this, schema, opts) : schema;
    */
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
export type ConflictResolutionResponse = {
  name: string,
  value: any
};

export type ConflictResolutionType = () => ConflictResolutionResponse | string;

export type SchemaDefinitionOptions = {
  onConflict?: ?ConflictResolutionType,
  noDefaultTypes?: ?boolean
};

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

