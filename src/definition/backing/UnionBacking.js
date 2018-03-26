// @flow
import { TypeBacking } from './TypeBacking';
import { SchemaBacking } from './SchemaBacking';
import { assert, assertType } from './utils';
import { set } from '../../jsutils/lodash.custom';

const type = 'Union';

export class UnionBacking extends TypeBacking {
  constructor(backing: SchemaBacking, name: string) {
    super(backing, name);
  }
  resolveType(func: () => ?mixed) {
    assert(typeof func === 'function', 'resolveType must be function');
    assertType(this.backing, this._name, type);
    set(this._backing, ['_types', this._name, 'resolveType'], func);
    set(this._backing, ['_types', this._name, 'type'], type);
    return this;
  }
}
