// @flow
import { TypeBacking } from './TypeBacking';
import { SchemaBacking } from './SchemaBacking';
import { assert, assertType } from './utils';
import { set } from '../../jsutils/lodash.custom';

const type = 'Scalar';

export class ScalarBacking extends TypeBacking {
  constructor(backing: SchemaBacking, name: string) {
    super(backing, name);
  }
  serialize(func: (value: any) => any) {
    assert(typeof func === 'function', 'serialize must be function');
    assertType(this.backing, this._name, type);
    set(this._backing, ['_types', this._name, 'serialize'], func);
    set(this._backing, ['_types', this._name, 'type'], type);
    return this;
  }
  parseValue(func: (value: mixed) => ?mixed) {
    assert(typeof func === 'function', 'parseValue must be function');
    assertType(this.backing, this._name, type);
    set(this._backing, ['_types', this._name, 'parseValue'], func);
    set(this._backing, ['_types', this._name, 'type'], type);
    return this;
  }
  parseLiteral(func: (valueNode: ValueNode) => ?mixed) {
    assert(typeof func === 'function', 'parseLiteral must be function');
    assertType(this.backing, this._name, type);
    set(this._backing, ['_types', this._name, 'parseLiteral'], func);
    set(this._backing, ['_types', this._name, 'type'], type);
    return this;
  }
}
