// @flow
import { TypeBacking } from './TypeBacking';
import { SchemaBacking } from './SchemaBacking';
import { assert, assertType } from './utils';
import { set } from '../../jsutils/lodash.custom';

const type = 'Object';

export class ObjectBacking extends TypeBacking {
  constructor(backing: SchemaBacking, name: string) {
    super(backing, name);
  }
  isTypeOf(func: () => ?mixed) {
    assert(typeof func === 'function', 'isTypeOf should be function');
    assertType(this.backing.this._name, type);
    set(this._backing, ['_types', this._name, 'isTypeOf'], func);
    set(this._backing, ['_types', this._name, 'type'], type);
    return this;
  }
  resolve(field: string, resolver: () => ?mixed) {
    assert(
      field && typeof field === 'string',
      'field name must be non-empty string',
    );
    assert(typeof resolver === 'function', 'resolver must be function');
    assertType(this.backing, this._name, type);
    set(
      this._backing,
      ['_types', this._name, 'fields', field, 'resolve'],
      resolver,
    );
    set(this._backing, ['_types', this._name, 'type'], type);
    return this;
  }
  subscribe(field: string, subscriber: () => ?mixed) {
    assert(
      field && typeof field === 'string',
      'field name must be non-empty string',
    );
    assert(typeof subscriber === 'function', 'subscriber must be function');
    assertType(this.backing, this._name, type);
    set(
      this._backing,
      ['_types', this._name, 'fields', field, 'subscribe'],
      subscriber,
    );
    set(this._backing, ['_types', this._name, 'type'], type);
    return this;
  }
}
