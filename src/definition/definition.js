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
import { GraphQLSchema, GraphQLDirective } from 'graphql';
import { SchemaBacking } from '../backing/backing';
import type { SchemaBackingConfig } from '../backing/backing';
import { deconstructSchema } from '../utilities/deconstruct';
import { exportDefinition } from '../utilities/export';
import buildSchema from '../utilities/buildSchema';
import type { ObjMap } from '../types/graphql';
import {
  isObject,
  intersection,
  forEach,
  get,
  map
} from '../jsutils';
import type {
  SchemaDefinitionConfig,
  UseArgument
} from './types';
import { mergeSchema, mergeWithConflicts } from './merge';
import { wrapMiddleware } from '../middleware/middleware';

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
function isDefinitionLike(definition: ObjMap<?mixed>) {
  return isObject(definition) &&
    intersection(
      DEFINITION_FIELDS,
      Object.keys(definition).reduce((fields, field) => {
        if (isObject(field)) {
          field.push(field);
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
 * Checks that a directive is included and throws an error otherwise
 * @param {*} msgPrefix 
 * @param {*} directives 
 * @param {*} def 
 * @param {*} depth 
 */
function checkDirectives(msgPrefix, directives, def, depth = 0) {
  const level = depth + 1;

  // check for cyclical directive definitions
  if (level > 50) {
    throw new Error('Circular directive dependency encountered. ' +
    'Please check that directives applied on directive arguments do not' +
    'reference parents')
  }
  const dirs = get(def, [ '@directives' ]);

  if (!isObject(dirs)) {
    return;
  }

  forEach(dirs, (args, name) => {
    const m = msgPrefix + ' directive "' + name + '"'
    if (isObject(args)) {
      forEach(args, (argDef, argName) => {
        checkDirectives(
          m + ', argument "' + argName + '"',
          directives,
          argDef,
          level
        );
      }, true)      
    }

    if (directives.indexOf(name) === -1) {
      throw new Error(m + ' is not included in the schema definition\'s ' +
      'directive include declaration');
    }
  }, true)
}

/**
 * Validates that directives applied at locations have been
 * included in the schema definition
 * @param {*} definition 
 */
function validateDirectives(definition) {
  const def = definition._config;
  const directives = get(def, [ 'schema', 'directives' ], []);
  const dirs = map(directives, directive => {
    if (typeof directive === 'string') {
      return directive.replace(/^@/, '');
    } else if (directive instanceof GraphQLDirective) {
      return directive.name;
    }
    throw new Error('Invalid directive value supplied in schema definition');
  }, true);

  // check types
  forEach(def.types, (typeDef, typeName) => {
    const typeMsg = 'DirectiveError: type "' + typeName + '"';
    checkDirectives(
      typeMsg,
      dirs,
      typeDef
    );

    switch (typeDef.type) {
      case 'Object':
      case 'Input':
      case 'Interface':
        forEach(typeDef.fields, (fieldDef, fieldName) => {
          const fieldMsg = typeMsg + ', field "' + fieldName + '"';

          if (isObject(fieldDef.args)) {
            forEach(fieldDef.args, (argDef, argName) => {
              checkDirectives(
                fieldMsg + ', argument "' + argName + '"',
                dirs,
                argDef
              );
            })
          }
          checkDirectives(
            fieldMsg,
            dirs,
            fieldDef
          );
        }, true);
        break;

      case 'Enum':
        forEach(typeDef.values, (valueDef, valueName) => {
          checkDirectives(
            typeMsg + ', value "' + valueName + '"',
            dirs,
            valueDef
          );
        }, true)
        break;

      default:
        break;
    }
  }, true)

  // check directives
  forEach(def.directives, (dirDef, dirName) => {
    const dirMsg = 'Directive "' + dirName + '"';
    checkDirectives(
      dirMsg,
      dirs,
      dirDef
    );

    forEach(dirDef.args, (argDef, argName) => {
      checkDirectives(
        dirMsg + ', argument "' + argName + '"',
        dirs,
        argDef
      )
    }, true);
  }, true)

  // check schema
  checkDirectives(
    'Schema',
    dirs,
    def.schema
  )
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
export class SchemaDefinition {
  _config: SchemaDefinitionConfig;
  _options: ObjMap<?mixed>;

  constructor(
    options?: ?ObjMap<?mixed>
  ) {
    this._options = isObject(options) ?
      options :
      Object.create(null);
    this._config = {
      context: {},
      functions: {},
      directives: {},
      types: {},
      schema: null
    };
  }

  /**
   * Adds a definition elements to the current definition
   * @param {*} args 
   * 
   * Signatures
   * 
   * | use(definition)
   * | use(definitionConfig)
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
    }

    throw new Error('Invalid use arguments, must be SchemaDefinition, ' +
      'SchemaDefinitionConfig, source, GraphQLSchema, GraphQLType, ' +
      'GraphQLDirective, function, or GraphQLFactoryPlugin');
  }

  /**
   * Merges a factory definition or definition-like object into
   * the current definition
   * @param {*} definition 
   */
  merge(
    definition: ObjMap<mixed> | SchemaDefinition | SchemaDefinitionConfig
  ) {
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
    const { definition, backing } = this.export();
    const schema = buildSchema(definition, backing);
    return wrap ? wrapMiddleware(schema, opts) : schema;
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
  export() {
    this.validate();
    return exportDefinition(this);
  }

  /**
   * Returns the definiton config
   */
  definition() {
    this.validate();
    return this._config;
  }
}
