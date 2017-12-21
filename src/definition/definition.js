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
import { GraphQLSchema, GraphQLDirective, isNamedType } from 'graphql';
import { JSONType, DateTimeType, GraphQLFactoryPlugin } from '../types';
import { SchemaBacking } from './backing';
import { fixDefinition } from './fix';
import { mergeDefinition } from './merge';
import { beforeBuild } from './beforeBuild';
import { printDefinition, buildSchema } from '../utilities';
import { wrapMiddleware } from '../execution/middleware';
import { lodash as _, stringMatch, asrt, forEach } from '../jsutils';
import { DEFINITION_FIELDS } from './const';
import {
  useLanguage,
  useSchema,
  useDirective,
  useType,
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

/**
 * performs a filter operation on a specified store
 * @param {*} operation 
 * @param {*} store 
 * @param {*} args 
 */
function filterStore(operation, store, args) {
  const filter = obj => {
    switch (operation) {
      case 'omit':
        return _.isFunction(args[0]) ?
          _.omitBy(obj, args[0]) :
          _.omit(obj, args);
      case 'pick':
        return _.isFunction(args[0]) ?
          _.pickBy(obj, args[0]) :
          _.pick(obj, args);
      default:
        break;
    }
  };
  switch (store) {
    case 'context':
    case 'functions':
    case 'directives':
    case 'plugins':
    case 'types':
      _.set(this, `_${store}`, filter(_.get(this, `_${store}`)));
      break;
    default:
      assert(false, `invalid store for ${operation} operation`);
      break;
  }
  return this;
}

/**
 * Attempts to install any uninstalled plugins
 */
function resolvePlugins() {
  forEach(this._plugins, (p, name) => {
    const { plugin, installed } = p;
    if (!installed) {
      assert(
        plugin instanceof GraphQLFactoryPlugin,
        `plugin ${name} is not an instance of GraphQLFactoryPlugin`
      );
      if (plugin.dependenciesMet(this)) {
        this.merge(plugin);
        plugin.install(this);
        p.installed = true;
      }
    }
  }, true);
  return this;
}

/**
 * Builds a new definition
 */
export class SchemaDefinition extends EventEmitter {
  _options: ObjMap<any>;
  _context: ObjMap<any>;
  _functions: ObjMap<?() => any>;
  _directives: ObjMap<?FactoryDirectiveConfig>;
  _types: ObjMap<?FactoryTypeConfig>;
  _schema: ?SchemaTypeConfig;
  _plugins: ObjMap<?GraphQLFactoryPlugin>;

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
    this._plugins = {};
  }

  /**
   * Adds definition configuration from various sources
   * @param {*} args 
   */
  use(...args: Array<any>) {
    const [ arg0, arg1, arg2 ] = args;

    // .use(SchemaDefinition)
    if (arg0 instanceof SchemaDefinition) {
      this.merge(arg0);
      return resolvePlugins.call(this);
    }

    // .use(SchemaBacking)
    if (arg0 instanceof SchemaBacking) {
      useBacking.call(this, arg0);
      return resolvePlugins.call(this);
    }

    // .use(GraphQLSchema [, namePrefix])
    if (arg0 instanceof GraphQLSchema) {
      useSchema.call(this, arg0, arg1);
      return resolvePlugins.call(this);
    }

    // .use(GraphQLDirective [, name])
    if (arg0 instanceof GraphQLDirective) {
      useDirective.call(this, arg0, arg1);
      return resolvePlugins.call(this);
    }

    // .use(GraphQLNamedType [, name])
    if (isNamedType(arg0)) {
      useType.call(this, arg0, arg1);
      return resolvePlugins.call(this);
    }

    // .use(GraphFactoryPlugin)
    if (arg0 instanceof GraphQLFactoryPlugin) {
      usePlugin.call(this, arg0, arg1);
      return resolvePlugins.call(this);
    }

    // .use(languageDefinition [, SchemaBacking] [, namePrefix])
    if (stringMatch(arg0, true)) {
      useLanguage.call(this, arg0, arg1, arg2);
      return resolvePlugins.call(this);
    }

    // .use(function, name)
    if (_.isFunction(arg0)) {
      assert(stringMatch(arg1, true), 'function name required');
      this.merge(_.set({}, [ 'functions', arg1 ], arg0));
      return resolvePlugins.call(this);
    }

    // .use(SchemaDefinitionConfig)
    if (isDefinitionLike(arg0)) {
      this.merge(arg0);
      return resolvePlugins.call(this);
    }

    // throw error if no conditions matched
    assert(false, 'invalid use arguments');
  }

  /**
   * Removes paths from a specified store
   * @param {*} store 
   * @param {*} args 
   */
  omit(store: string, ...args: Array<string | () => ?mixed>) {
    return filterStore.call(this, 'omit', store, args);
  }

  /**
   * Picks paths from a specific store
   * @param {*} store 
   * @param {*} args 
   */ 
  pick(store: string, ...args: Array<string | () => ?mixed>) {
    return filterStore.call(this, 'pick', store, args);
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
    forEach(this._plugins, (plugin, name) => {
      assert(plugin.installed, 'failed to build, plugin "' + name +
      '" has not been installed due to unmet dependencies');
    }, true);
    beforeBuild.call(this, options);
    const { definition, backing } = this.export();
    const schema = buildSchema(definition, backing);
    _.set(schema, 'definition', this);
    return wrap ? wrapMiddleware(this, schema, opts) : schema;
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
