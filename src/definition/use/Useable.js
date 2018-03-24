import { SchemaDefinition } from '../SchemaDefinition';
import { isPromise } from '../../jsutils';

export class Useable {
  constructor(definition) {
    if (!(definition instanceof SchemaDefinition)) {
      throw new Error('Usable requires a SchemaDefinition');
    }
    this.definition = definition;
  }

  isUsable(...args) {
    return this._isUsable(...args);
  }

  use(...args) {
    if (isPromise(this.definition._build)) {
      this.definition._build = this.definition._build.then(() => {
        return this._use(...args);
      });
      return this.definition;
    }
    const result = this._use(...args);

    if (isPromise(result)) {
      this.definition._build = result;
    }
    return this.definition;
  }

  _isUsable() {
    return false;
  }
  _use() {
    return this.definition;
  }
}
