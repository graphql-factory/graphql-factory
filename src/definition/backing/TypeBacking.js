// @flow
import { SchemaBacking } from './SchemaBacking';
import { assert } from './utils';

export class TypeBacking {
  _backing: SchemaBacking;
  _name: string;
  constructor(backing: SchemaBacking, name: string) {
    assert(name && typeof name === 'string', 'Name must be non-empty string');
    this._backing = backing;
    this._name = name;
  }
  Directive(name: string) {
    return this._backing.Directive(name);
  }
  Interface(name: string) {
    return this._backing.Interface(name);
  }
  Object(name: string) {
    return this._backing.Object(name);
  }
  Scalar(name: string) {
    return this._backing.Scalar(name);
  }
  Union(name: string) {
    return this._backing.Union(name);
  }
  Enum(name: string) {
    return this._backing.Enum(name);
  }
  get backing() {
    return this._backing;
  }
}
