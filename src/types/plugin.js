import assert from 'assert';

function isString(str) {
  return typeof str === 'string' && str !== '';
}

export class GraphQLFactoryPlugin {
  constructor(name, version) {
    assert(isString(name), 'GraphQLFactoryPlugin name must be a string');
    assert(isString(version), 'GraphQLFactoryPlugin version must be a string');
    this.name = name;
    this.version = version;
  }

  install(...args) {
    if (this._install === 'function') {
      return this._install(...args);
    }
  }
}
