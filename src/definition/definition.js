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
import type {
  GraphQLFieldResolver,
  SchemaDefinitionNode,
  GraphQLObjectType,
  GraphQLNamedType,
} from 'graphql';
import {
  GraphQLError,
  GraphQLSchema,
  GraphQLDirective,
  isNamedType,
  buildSchema as graphqlBuildSchema,
} from 'graphql';
import { SchemaBacking } from './backing';
import { fixDefinition } from './fix';
import { mergeDefinition } from './merge';
import { buildResolver } from './build';
import { printDefinition, buildSchema } from '../utilities';
import { DEFINITION_FIELDS } from './const';
import {
  JSONType,
  DateTimeType,
  GraphQLFactoryPlugin,
  RemoteSchema,
} from '../types';
import {
  lodash as _,
  stringMatch,
  asrt,
  forEach,
  promiseReduce,
} from '../jsutils';
import {
  useLanguage,
  useSchema,
  useDirective,
  useType,
  usePlugin,
  useBacking,
  useFile,
} from './use';

export const DEFINITION_VERSION = '3.0.0';
export const FILE_EXT_RX = /\w\.(graphql|gql|graphqlx|gqlx)$/i;

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
        return _.isFunction(args[0])
          ? _.omitBy(obj, args[0])
          : _.omit(obj, args);
      case 'pick':
        return _.isFunction(args[0])
          ? _.pickBy(obj, args[0])
          : _.pick(obj, args);
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
function resolvePlugins(definition: SchemaDefinition) {
  return promiseReduce(
    definition._plugins,
    (accum, p, name) => {
      const { plugin, installed } = p;
      if (!installed) {
        assert(
          plugin instanceof GraphQLFactoryPlugin,
          `plugin ${name} is not an instance of GraphQLFactoryPlugin`,
        );
        if (plugin.dependenciesMet(definition)) {
          definition.merge(plugin);
          return Promise.resolve(plugin.install(definition)).then(() => {
            p.installed = true;
          });
        }
      }
    },
    null,
    true,
  );
}

/**
 * Run code after every use
 */
function postProcessUse(definition: SchemaDefinition) {
  return resolvePlugins(definition).then(() => {
    return fixDefinition.call(definition);
  });
}

/**
 * Builds a new definition
 */
export class SchemaDefinition extends EventEmitter {
  _build: Promise<any>;
  _options: ObjMap<any>;
  _context: ObjMap<any>;
  _functions: ObjMap<?() => any>;
  _directives: ObjMap<?FactoryDirectiveConfig>;
  _types: ObjMap<?FactoryTypeConfig>;
  _schema: ?SchemaTypeConfig;
  _plugins: ObjMap<?FactoryPluginResolved>;

  constructor(options?: ?SchemaDefinitionOptions) {
    super();
    this._build = Promise.resolve();
    this._options = Object.assign({}, options);
    this._context = {};
    this._functions = {};
    this._directives = {};
    this._types =
      this._options.noDefaultTypes !== true
        ? { DateTime: DateTimeType, JSON: JSONType }
        : {};
    this._schema = null;
    this._plugins = {};
  }

  /**
   * Adds definition configuration from various sources
   * @param {*} args
   */
  use(...args: Array<any>) {
    const [arg0, arg1, arg2] = args;
    this._build = this._build
      .then(() => {
        if (arg0 instanceof SchemaDefinition) {
          // .use(SchemaDefinition)
          return arg0.then(() => {
            return this.merge(arg0);
          });
        } else if (arg0 instanceof SchemaBacking) {
          // .use(SchemaBacking)
          return useBacking(this, arg0);
        } else if (arg0 instanceof GraphQLSchema) {
          // .use(GraphQLSchema [, namePrefix])
          return useSchema(this, arg0, arg1);
        } else if (arg0 instanceof RemoteSchema) {
          // .use(RemoteSchema, [, namePrefix])
          return arg0.buildSchema().then(remoteSchema => {
            return useSchema(this, remoteSchema, arg1);
          });
        } else if (arg0 instanceof GraphQLDirective) {
          // .use(GraphQLDirective [, name])
          return useDirective(this, arg0, arg1);
        } else if (isNamedType(arg0)) {
          // .use(GraphQLNamedType [, name])
          return useType(this, arg0, arg1);
        } else if (arg0 instanceof GraphQLFactoryPlugin) {
          // .use(GraphFactoryPlugin)
          return usePlugin(this, arg0, arg1);
        } else if (stringMatch(arg0, true) && arg0.match(FILE_EXT_RX)) {
          // .use(File [, SchemaBacking] [, options])
          return useFile(this, arg0, arg1, arg2);
        } else if (stringMatch(arg0, true)) {
          // .use(languageDefinition [, SchemaBacking] [, namePrefix])
          return useLanguage(this, arg0, arg1, arg2);
        } else if (_.isFunction(arg0)) {
          // .use(function, name)
          assert(stringMatch(arg1, true), 'function name required');
          return this.merge(_.set({}, ['functions', arg1], arg0));
        } else if (isDefinitionLike(arg0)) {
          // .use(SchemaDefinitionConfig)
          return this.merge(arg0);
        } else if (arg0 === undefined) {
          // allow calling an empty use to resolve the promise
          return this;
        }
        // throw error if no conditions matched
        assert(false, 'invalid use arguments');
      })
      .then(() => {
        return postProcessUse(this);
      });
    return this;
  }

  /**
   * Removes paths from a specified store
   * @param {*} store
   * @param {*} args
   */
  omit(store: string, ...args: Array<string | (() => ?mixed)>) {
    return filterStore.call(this, 'omit', store, args);
  }

  /**
   * Picks paths from a specific store
   * @param {*} store
   * @param {*} args
   */

  pick(store: string, ...args: Array<string | (() => ?mixed)>) {
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
  export(): Promise<ObjMap<any>> {
    return this._build
      .then(() => {
        return fixDefinition.call(this).validate();
      })
      .then(() => {
        return {
          definition: printDefinition(this),
          backing: new SchemaBacking().import(this),
        };
      });
  }

  /**
   * Builds an executable schema from the current definition
   */
  buildSchema(): FactorySchema {
    // first build a mock schema to return
    const schema = (graphqlBuildSchema(`
      type Query { version: Int }
      schema { query: Query }`): FactorySchema);

    // extend the schema
    schema.definition = this;
    schema.build = () => {
      return this._build.then(() => {
        return this;
      });
    };
    schema.request = (...args) => {
      return this._build.then(() => {
        if (typeof schema.request === 'function') {
          return schema.request(...args);
        }
        throw new Error('The schema could not be built');
      });
    };
    schema.rebuild = () => {
      return this._build.then(() => {
        const rebuiltSchema = this.buildSchema();
        if (typeof rebuiltSchema.build === 'function') {
          const rebuild = rebuiltSchema.build();
          if (rebuild && typeof rebuild.then === 'function') {
            return rebuild.then(() => {
              return Object.assign(schema, rebuiltSchema);
            });
          }
        }
        return schema;
      });
    };

    // resolve any pending build tasks
    this._build = this._build
      .then(() => {
        forEach(
          this._plugins,
          (plugin, name) => {
            assert(
              plugin.installed,
              'failed to build, plugin "' +
                name +
                '" has not been installed due to unmet dependencies: [ ' +
                plugin.plugin
                  .unmetDependencies(this)
                  .map(d => `${d.type}:${d.name}`)
                  .join(', ') +
                ' ]',
            );
          },
          true,
        );
      })
      .then(() => {
        return buildResolver.call(this);
      })
      .then(() => {
        fixDefinition.call(this).validate();
        const definition = printDefinition(this);
        const backing = new SchemaBacking().import(this);
        const factorySchema = buildSchema(definition, backing);
        Object.assign(schema, factorySchema);
        return schema;
      });

    // return the schema
    return schema;
  }

  /**
   * Resolves the current promise chain and returns the definition
   * @param {*} executor
   */
  get definition(): Promise<SchemaDefinition> {
    return this._build
      .then(() => {
        return this;
      })
      .catch(error => {
        return Promise.reject(error);
      });
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
  value: any,
};

export type ConflictResolutionType = () => ConflictResolutionResponse | string;

export type SchemaDefinitionOptions = {
  onConflict?: ?ConflictResolutionType,
  noDefaultTypes?: ?boolean,
};

export type SchemaTypeConfig = {
  directives?: ?Array<string>,
  query: string,
  mutation?: ?string,
  subscription?: ?string,
  '@directives'?: ?FactoryDirectiveAttachConfig,
};

export type FactoryDirectiveConfig = {
  description?: ?string,
  locations: Array<string>,
  args?: ?FactoryFieldConfigArgumentMap,
  before?: ?GraphQLFieldResolver<*, *>,
  after?: ?GraphQLFieldResolver<*, *>,
  build?: ?() => any,
};

export type FactoryPluginResolved = {
  installed: boolean,
  plugin: GraphQLFactoryPlugin,
};

export type TypeMap = ObjMap<GraphQLNamedType>;

export type FactorySchema = {
  astNode: ?SchemaDefinitionNode,
  _queryType: ?GraphQLObjectType,
  _mutationType: ?GraphQLObjectType,
  _subscriptionType: ?GraphQLObjectType,
  _directives: $ReadOnlyArray<GraphQLDirective>,
  _typeMap: TypeMap,
  _implementations: ObjMap<Array<GraphQLObjectType>>,
  _possibleTypeMap: ?ObjMap<ObjMap<boolean>>,
  __validationErrors: ?$ReadOnlyArray<GraphQLError>,
  __allowedLegacyNames: ?$ReadOnlyArray<string>,
  definition?: ?SchemaDefinition,
  build?: () => ?Promise<SchemaDefinition>,
  rebuild?: () => ?Promise<FactorySchema>,
  request?: () => ?Promise<any>,
};

// TODO: fully define these
export type FactoryFieldConfigArgumentMap = ObjMap<?mixed>;
export type FactoryDirectiveAttachConfig =
  | ObjMap<?mixed>
  | Array<DirectiveItem>;
export type FactoryTypeConfig = ObjMap<?mixed>;
export type FactoryDirectiveMap = ObjMap<mixed>;
export type DirectiveItem = {
  name: String,
  args: any,
};
