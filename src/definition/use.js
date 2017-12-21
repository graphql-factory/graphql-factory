/**
 * @flow
 */
import { SchemaBacking } from './backing';
import { GraphQLFactoryPlugin } from '../types';
import { buildSchema } from '../utilities';
import { lodash as _, asrt } from '../jsutils';
import { PluginConflictResolution } from './const';
import { GraphQLDirective, GraphQLSchema } from 'graphql';
import type { GraphQLNamedType } from 'graphql';
import { EventType } from './const';
import {
  deconstructSchema,
  deconstructDirective,
  deconstructType
} from './deconstruct';

/**
 * Builds a schema from language definition/optional backing and
 * merges it into the definition
 * @param {*} definition 
 * @param {*} backing 
 * @param {*} prefix 
 */
export function useLanguage(
  source: string,
  backing?: ?SchemaBacking,
  prefix?: ?string
) {
  return useSchema.call(this, buildSchema(source, backing), prefix);
}

/**
 * Deconstructs a schema into a factory definition and
 * merges it into the definition
 * @param {*} schema 
 * @param {*} prefix 
 */
export function useSchema(schema: GraphQLSchema, prefix?: ?string) {
  return this.merge(deconstructSchema(schema, prefix));
}

/**
 * deconstructs a directive and merges it into the definition with
 * optional new name
 * @param {*} directive 
 * @param {*} name 
 */
export function useDirective(directive: GraphQLDirective, name?: ?string) {
  const useName = _.isString(name) && name ? name : directive.name;
  return this.merge({
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
export function useType(type: GraphQLNamedType, name?: ?string) {
  const useName = _.isString(name) && name ? name : type.name;
  return this.merge({
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
  const oldPlugin = _.get(this._plugins, [ plugin.name ]);

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
        return this;
      case PluginConflictResolution.ERROR:
        this.emit(EventType.ERROR, new Error(errText));
        return asrt('definition', false, errText);
      case PluginConflictResolution.WARN:
        this.emit(EventType.WARN, errText);
        break;
      default:
        break;
    }
  }

  // no conflict, or warn, or replace sets the new plugin
  this._plugins[plugin.name] = {
    installed: false,
    plugin
  };
  return this;
}

/**
 * Merges a backing into the definition
 * @param {*} backing 
 */
export function useBacking(backing: SchemaBacking) {
  const _backing = new SchemaBacking(backing);
  _backing.validate();
  _.merge(this._types, _backing.types);
  _.merge(this._directives, _backing.directives);
  return this;
}
