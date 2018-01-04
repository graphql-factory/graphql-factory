/**
 * @flow
 */
import path from 'path';
import fs from 'fs';
import { SchemaDefinition } from './definition';
import { SchemaBacking } from './backing';
import { GraphQLFactoryPlugin } from '../types';
import { buildSchema } from '../utilities';
import { lodash as _, asrt } from '../jsutils';
import { PluginConflictResolution } from './const';
import { GraphQLDirective, GraphQLSchema } from 'graphql';
import type { GraphQLNamedType } from 'graphql';
import type { ObjMap } from 'graphql/jsutils/ObjMap';
import { EventType } from './const';
import {
  deconstructSchema,
  deconstructDirective,
  deconstructType
} from './deconstruct';

/**
 * Imports a graphql, gql, graphqlx, or gqlx file with optional
 * backing and prefix
 * @param {*} file 
 * @param {*} backing 
 * @param {*} options
 */
export function useFile(
  definition: SchemaDefinition,
  file: string,
  backing?: ?SchemaBacking,
  options?: ?ObjMap<any>): Promise<any> {
    let _backing = backing;
    let _options = options;
    if (!(backing instanceof SchemaBacking)) {
      _options = _backing;
      _backing = undefined;
    }
    const encoding = _.get(_options, 'encoding', 'utf8');
    const prefix = _.get(_options, 'prefix');

    return new Promise((resolve, reject) => {
      fs.readFile(path.resolve(file), (error, data) => {
        try {
          if (error) {
            throw error;
          }
          const source = data.toString(encoding);
          switch (path.extname(file).toLowerCase()) {
            case '.graphql':
            case '.gql':
              useLanguage(definition, source, _backing, prefix);
              break;
            case '.graphqlx':
            case '.gqlx':
              break;
            default:
              break;
          }
          return resolve();
        } catch (err) {
          return reject(err);
        }
      });
    });
}

/**
 * Builds a schema from language definition/optional backing and
 * merges it into the definition
 * @param {*} definition 
 * @param {*} backing 
 * @param {*} prefix 
 */
export function useLanguage(
  definition: SchemaDefinition,
  source: string,
  backing?: ?SchemaBacking,
  prefix?: ?string
) {
  return useSchema(definition, buildSchema(source, backing), prefix);
}

/**
 * Deconstructs a schema into a factory definition and
 * merges it into the definition
 * @param {*} schema 
 * @param {*} prefix 
 */
export function useSchema(
  definition: SchemaDefinition,
  schema: GraphQLSchema,
  prefix?: ?string
) {
  return definition.merge(deconstructSchema(schema, prefix));
}

/**
 * deconstructs a directive and merges it into the definition with
 * optional new name
 * @param {*} directive 
 * @param {*} name 
 */
export function useDirective(
  definition: SchemaDefinition,
  directive: GraphQLDirective,
  name?: ?string
) {
  const useName = _.isString(name) && name ? name : directive.name;
  return definition.merge({
    directives: {
      [useName]: deconstructDirective(directive)
    }
  });
}

/**
 * deconstructs a named type and merges it into the definition with
 * optional new name
 * @param {*} type 
 * @param {*} name 
 */
export function useType(
  definition: SchemaDefinition,
  type: GraphQLNamedType,
  name?: ?string
) {
  const useName = _.isString(name) && name ? name : type.name;
  return definition.merge({
    types: {
      [useName]: deconstructType(type)
    }
  });
}

/**
 * Installs a plugin and merges any definition configuration
 * @param {*} plugin 
 */
export function usePlugin(
  definition: SchemaDefinition,
  plugin: GraphQLFactoryPlugin,
  onConflict?: ?string
) {
  if (onConflict) {
    asrt(
      'definition',
      _.includes(_.values(PluginConflictResolution), onConflict),
      'invalid plugin conflict resolution'
    );
  }
  const errText = 'a plugin with the name "' + plugin.name +
  '" has already been added to the definition';
  const oldPlugin = _.get(definition._plugins, [ plugin.name ]);

    // handle conflict resolution
  if (oldPlugin.plugin instanceof GraphQLFactoryPlugin) {
    const conflict = onConflict ?
      onConflict :
      oldPlugin.onConflict ?
        oldPlugin.onConflict :
        PluginConflictResolution.WARN;
    asrt(
      'definition',
      !oldPlugin.installed ||
      onConflict === PluginConflictResolution.REINSTALL,
      'a plugin with the name "' + plugin.name +
      '" has already been installed'
    );
    switch (conflict) {
      case PluginConflictResolution.SKIP:
        return definition;
      case PluginConflictResolution.ERROR:
        definition.emit(EventType.ERROR, new Error(errText));
        return asrt('definition', false, errText);
      case PluginConflictResolution.WARN:
        definition.emit(EventType.WARN, errText);
        break;
      default:
        break;
    }
  }

  // no conflict, or warn, or replace sets the new plugin
  definition._plugins[plugin.name] = {
    installed: false,
    plugin
  };
  return definition;
}

/**
 * Merges a backing into the definition
 * @param {*} backing 
 */
export function useBacking(
  definition: SchemaDefinition,
  backing: SchemaBacking
) {
  const _backing = new SchemaBacking(backing);
  _backing.validate();
  _.merge(definition._types, _backing.types);
  _.merge(definition._directives, _backing.directives);
  return definition;
}
