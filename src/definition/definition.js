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
import EventEmitter from 'events';
import assert from 'assert';
import { GraphQLSchema } from 'graphql';
import { SchemaBacking } from '../backing/backing';
import type { SchemaBackingConfig } from '../backing/backing';
import { deconstructSchema } from '../utilities/deconstruct';
import { exportDefinition } from '../utilities/export';
import buildSchema from '../utilities/buildSchema';
import type { ObjMap } from 'graphql/jsutils/ObjMap';
import { validateDirectives } from './validate';
import { fixDefinition } from './fix';
import { JSONType, DateTimeType } from '../types';
import {
  set,
  isObject,
  intersection
} from '../jsutils';
import type {
  SchemaDefinitionConfig,
  UseArgument,
  SchemaTypeConfig,
  FactoryTypeConfig,
  FactoryDirectiveDefinitionConfig
} from './types';
import { mergeSchema, mergeWithConflicts } from './merge';
import { wrapMiddleware } from '../middleware/middleware';

// reserved factory events
export const FactoryEvents = {
  EXECUTION: 'execution',
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info'
};

const DEFINITION_FIELDS = [
  'context',
  'functions',
  'directives',
  'types',
  'schema'
];

/**
 * Determines if the object looks like a definition enough
 * to process it as one
 * @param {*} definition 
 */
function isDefinitionLike(definition: any) {
  return isObject(definition) &&
    intersection(
      DEFINITION_FIELDS,
      Object.keys(definition).reduce((fields, field) => {
        if (isObject(definition[field])) {
          fields.push(field);
        }
        return fields;
      }, [])
    ).length;
}

/**
 * Adds a schema to the definition
 * @param {*} definition 
 * @param {*} schema 
 * @param {*} prefix 
 */
function useSchema(
  definition: SchemaDefinition,
  schema: GraphQLSchema,
  prefix?: ?string
) {
  const factoryDef = deconstructSchema(schema, prefix);
  return definition.merge(factoryDef);
}

/**
 * Takes schema language and optional backing and creates
 * a factory definition then merges that definition into the current
 * @param {*} definition 
 * @param {*} source 
 * @param {*} backing 
 * @param {*} options 
 */
function useLanguage(
  definition: SchemaDefinition,
  source: string,
  backing?: ?SchemaBacking | ?SchemaBackingConfig,
  prefix?: ?string
) {
  return useSchema(
    definition,
    buildSchema(source, backing),
    prefix
  );
}

/**
 * Creates a schema definition that has useful methods for
 * adding additional definition elements as well as validating
 * and building an executable schema
 * 
 * Options:
 * 
 * * conflict - how to resolve a type name conflict
 */
export class SchemaDefinition extends EventEmitter {
  _config: SchemaDefinitionConfig;
  _options: ObjMap<?mixed>;

  constructor(
    options?: ?ObjMap<?mixed>
  ) {
    super();
    this._options = options !== null && typeof options === 'object' ?
      options :
      Object.create(null);
    this._config = {
      context: {},
      functions: {},
      directives: {},
      types: {
        DateTime: DateTimeType,
        JSON: JSONType
      },
      schema: null
    };
  }

  /**
   * Adds a definition elements to the current definition
   * @param {*} args 
   * 
   * Signatures
   * 
   * | use(SchemaDefinition)
   * | use(SchemaDefinitionConfig)
   * | use(source [, backing] [, prefix])
   * | use(GraphQLSchema [, options])
   * | use(GraphQLDirective)
   * | use(GraphQLType, [, name])
   * | use(function, functionName)
   * | use(plugin)
   */
  use(...args: Array<UseArgument>) {
    const [ arg0, arg1, arg2 ] = args;

    if (arg0 instanceof SchemaDefinition || isDefinitionLike(arg0)) {
      // schema definition or config
      return this.merge(arg0);
    } else if (typeof arg0 === 'string') {
      // source and optional backing
      const backing = arg1 instanceof SchemaBacking ? arg1 : null;
      const prefix = backing ?
        typeof arg2 === 'string' ? arg2 : '' :
        typeof arg1 === 'string' ? arg1 : '';
      return useLanguage(this, arg0, backing, prefix);
    } else if (arg0 instanceof GraphQLSchema) {
      // GraphQLSchema
      const prefix = typeof arg1 === 'string' ? arg1 : '';
      return useSchema(this, arg0, prefix);
    } else if (typeof arg0 === 'function') {
      assert(
        typeof arg1 === 'string' && arg1 !== '',
        'UseError: Using a function requires a name as the second argument'
      );
      return this.merge(set({}, [ 'functions', arg1 ], arg0));
    }

    throw new Error('UseError: Invalid use arguments, must be ' +
    'SchemaDefinition, SchemaDefinitionConfig, source, GraphQLSchema, ' +
    'GraphQLType, GraphQLDirective, function, or GraphQLFactoryPlugin');
  }



  /**
   * Merges a factory definition or definition-like object into
   * the current definition
   * @param {*} definition 
   */
  merge(definition: any) {
    const { conflict } = this._options;
    const config = definition instanceof SchemaDefinition ?
      definition._config :
      definition;
    if (!config) {
      throw new Error('Cannot merge invalid configuration');
    }

    const {
      context,
      functions,
      directives,
      types,
      schema
    } = config;

    if (isObject(context)) {
      this._config.context = mergeWithConflicts(
        this._config.context,
        context,
        conflict,
        'context'
      );
    }

    if (isObject(functions)) {
      this._config.functions = mergeWithConflicts(
        this._config.functions,
        functions,
        conflict,
        'function'
      );
    }

    if (isObject(directives)) {
      this._config.directives = mergeWithConflicts(
        this._config.directives,
        directives,
        conflict,
        'directive'
      );
    }

    if (isObject(types)) {
      this._config.types = mergeWithConflicts(
        this._config.types,
        types,
        conflict,
        'type'
      );
    }

    if (isObject(schema)) {
      this._config.schema = mergeSchema(this, config);
    }

    return this;
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
  }

  /**
   * Performs a check of the definition and fixes any shorthand
   * @param {*} options 
   */
  fix(options?: ?ObjMap<?mixed>) {
    fixDefinition(this._config, options);
    return this;
  }

  /**
   * Validates the current definition
   */
  validate() {
    validateDirectives(this);
    return this;
  }

  /**
   * Exports the current definition as an object containing
   * schema language source and a SchemaBacking
   */
  export(options?: ?ObjMap<?mixed>) {
    this.fix(options).validate();
    return exportDefinition(this);
  }

  /**
   * Returns the definiton config
   */
  config() {
    return this._config;
  }

  get context(): ?ObjMap<() => mixed> {
    return this._config.context;
  }

  get functions(): ?ObjMap<() => mixed> {
    return this._config.functions;
  }

  get directives(): ?ObjMap<FactoryDirectiveDefinitionConfig> {
    return this._config.directives;
  }

  get types(): ?ObjMap<FactoryTypeConfig> {
    return this._config.types;
  }

  get schema(): ?SchemaTypeConfig {
    return this._config.schema;
  }
}
