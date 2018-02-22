/**
 * Base class for a GraphQLFactory Plugin
 * Plugins are composed of definition fields as well as an
 * install function. They can also specify dependencies that must
 * be met before they can be installed.
 * 
 * Installation happens in 2 steps. Once a plugins dependencies have
 * all been met, the plugins defenition elements are merged with the
 * SchemaDefinition then its install function is called with the
 * SchemaDefinition as its only argument.
 * 
 * In the event a plugin is not installed and the buildSchema method
 * is called on the SchemaDefinition an error will be thrown
 * 
 * Plugins can use an onConflict value to determine what happens on
 * plugin name conflict. If there is a conflict and the plugin has
 * already been installed, and error will be thrown unless the reinstall
 * conflict resolution has been set, which will install the plugin over
 * the previous
 * 
 * @flow
 */
import assert from 'assert';
import { PluginConflictResolution } from '../definition/const';
import { lodash as _, semver, stringMatch } from '../jsutils';
import type { ObjMap } from 'graphql/jsutils/ObjMap';
import { SchemaDefinition } from '../definition';

export const DependencyType = {
  DIRECTIVE: 'directive',
  TYPE: 'type',
  FUNCTION: 'function',
  SCHEMA: 'schema',
  CONTEXT: 'context'
};

export class PluginDependency {
  type: string;
  name: string;
  constructor(type: string, name: string) {
    assert(
      _.includes(_.values(DependencyType), type),
      'Invalid dependency type'
    );
    assert(stringMatch(name, true), 'Invalid dependency name');
    this.type = type;
    this.name = name;
  }
}

export class GraphQLFactoryPlugin {
  name: string;
  version: string;
  _directives: ObjMap<any>;
  _functions: ObjMap<any>;
  _context: ObjMap<any>;
  _types: ObjMap<any>;
  _schema: ObjMap<any>;
  _dependencies: Array<PluginDependency>;
  constructor(name: string, version: string) {
    assert(stringMatch(name, true), 'GraphQLFactoryPlugin name must be a ' +
    'unique string');
    assert(semver.valid(version), 'GraphQLFactoryPlugin version must be a ' +
    'basic semmver 2.0.0 (https://semver.org/) formatted version string');
    this.name = name;
    this.version = semver.clean(version);
    this._directives = {};
    this._functions = {};
    this._context = {};
    this._types = {};
    this._schema = {};
    this._dependencies = [];
  }

  /**
   * Checks if a dependency already exists
   * @param {*} type 
   * @param {*} name
   */
  hasDependency(type: string, name: string) {
    assert(
      _.includes(_.values(DependencyType), type),
      'Invalid dependency type'
    );
    assert(stringMatch(name, true), 'Invalid dependency name');
    return this._dependencies.filter(dependency => {
      return dependency.type === type && dependency.name === name;
    }).length > 0;
  }

  /**
   * Adds a new plugin dependency
   * @param {*} type 
   * @param {*} name
   */
  addDependency(type: string, name: string) {
    if (!this.hasDependency(type, name)) {
      this._dependencies.push(new PluginDependency(type, name));
    }
  }

  /**
   * Determines if all the dependencies are met
   */
  dependenciesMet(definition: SchemaDefinition) {
    return !this.unmetDependencies(definition).length;
    /*
    return this._dependencies.length ?
      this._dependencies.reduce((result, { type, name }) => {
        const store = type === DependencyType.SCHEMA ? type : `${type}s`;
        const value = _.get(definition, [ store ].concat(_.toPath(name)));
        switch (type) {
          case DependencyType.DIRECTIVE:
          case DependencyType.TYPE:
          case DependencyType.SCHEMA:
            return result && _.isObjectLike(value) && _.keys(value).length;
          case DependencyType.CONTEXT:
            return result && _.has(this, [ type ].concat(_.toPath(name)));
          case DependencyType.FUNCTION:
            return result && _.isFunction(value);
          default:
            return result;
        }
      }, true) :
      true;
      */
  }

  unmetDependencies(definition: SchemaDefinition) {
    return this._dependencies.reduce((result, dep) => {
      const { type, name } = dep;
      const store = type === DependencyType.SCHEMA ? type : `${type}s`;
      const value = _.get(definition, [ store ].concat(_.toPath(name)));
      switch (type) {
        case DependencyType.DIRECTIVE:
        case DependencyType.TYPE:
        case DependencyType.SCHEMA:
          if (!_.isObjectLike(value) || !_.keys(value).length) {
            result.push(dep);
          }
          break;
        case DependencyType.CONTEXT:
          if (!_.has(this, [ type ].concat(_.toPath(name)))) {
            result.push(dep);
          }
          break;
        case DependencyType.FUNCTION:
          if (!_.isFunction(value)) {
            result.push(dep);
          }
          break;
        default:
          break;
      }
      return result;
    }, []);
  }

  /**
   * Performs a custom install operation
   * must be asyncronous
   * @param {*} args 
   */
  install(definition: SchemaDefinition) {
    if (typeof this._install === 'function') {
      return this._install(definition);
    }
  }

  get onConflict(): any {
    return this._onConflict || PluginConflictResolution.WARN;
  }

  get directives(): ObjMap<?any> {
    return _.isObjectLike(this._directives) ? this._directives : {};
  }

  get functions(): ObjMap<?any> {
    return _.isObjectLike(this._functions) ? this._functions : {};
  }

  get context(): ObjMap<?any> {
    return _.isObjectLike(this._context) ? this._context : {};
  }

  get types(): ObjMap<?any> {
    return _.isObjectLike(this._types) ? this._types : {};
  }

  get schema(): ObjMap<?any> {
    return _.isObjectLike(this._schema) ? this._schema : {};
  }

  get dependencies(): Array<PluginDependency> {
    return Array.isArray(this._dependencies) ? this._dependencies : [];
  }
}
