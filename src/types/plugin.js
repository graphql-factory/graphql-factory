/**
 * @flow
 */
import assert from 'assert';
import { semver } from '../jsutils/semver';
import type { ObjMap } from 'graphql/jsutils/ObjMap';

function isString(str) {
  return typeof str === 'string' && str !== '';
}

function isObjectLike(obj) {
  return typeof obj === 'object' && obj !== null;
}

function values(obj) {
  return Object.keys(obj).map(key => obj[key]);
}

function includes(array, value) {
  return array.indexOf(value) !== -1;
}

export const DependencyType = {
  DIRECTIVE: 'directive',
  TYPE: 'type',
  FUNCTION: 'function'
};

export class PluginDependency {
  type: string;
  value: string;
  constructor(type: string, value: string) {
    assert(includes(values(DependencyType), type), 'Invalid dependency type');
    assert(isString(value), 'Invalid dependency value');
    this.type = type;
    this.value = value;
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
    assert(isString(name), 'GraphQLFactoryPlugin name must be a ' +
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

  install(...args: Array<any>) {
    if (typeof this._install === 'function') {
      return this._install(...args);
    }
  }

  get directives(): ObjMap<?any> {
    return isObjectLike(this._directives) ? this._directives : {};
  }

  get functions(): ObjMap<?any> {
    return isObjectLike(this._functions) ? this._functions : {};
  }

  get context(): ObjMap<?any> {
    return isObjectLike(this._context) ? this._context : {};
  }

  get types(): ObjMap<?any> {
    return isObjectLike(this._types) ? this._types : {};
  }

  get schema(): ObjMap<?any> {
    return isObjectLike(this._schema) ? this._schema : {};
  }

  get dependencies(): Array<PluginDependency> {
    return Array.isArray(this._dependencies) ? this._dependencies : [];
  }
}
