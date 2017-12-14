/**
 * @flow
 */
import { deconstructSchema, deconstructDirective } from './deconstruct';
import { SchemaBacking } from './backing';
import { GraphQLFactoryPlugin } from '../types';
import { buildSchema } from '../utilities';
import { lodash as _ } from '../jsutils';
import { GraphQLDirective, GraphQLSchema } from 'graphql';

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
 * Deconstructs a directive and
 * merges it into the definition
 * @param {*} directive 
 */
export function useDirective(directive: GraphQLDirective) {
  return this.merge({
    directives: {
      [directive.name]: deconstructDirective(directive)
    }
  });
}

/**
 * Installs a plugin and merges any definition configuration
 * @param {*} plugin 
 */
export function usePlugin(plugin: GraphQLFactoryPlugin) {
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
