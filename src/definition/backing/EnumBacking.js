// @flow
import { set } from '../../jsutils/lodash.custom';
import { assert, assertType } from './utils';
import { TypeBacking } from './TypeBacking';
import { SchemaBacking } from './SchemaBacking';

const type = 'Enum';

export class EnumBacking extends TypeBacking {
  constructor(backing: SchemaBacking, name: string) {
    super(backing, name);
  }
  value(name: string, value: any) {
    assert(
      name && typeof name === 'string',
      'Value name must be non-empty string',
    );
    assertType(this.backing, this._name, type);
    set(this._backing, ['_types', this._name, 'values', name, 'value'], value);
    set(this._backing, ['_types', this._name, 'type'], type);
    return this;
  }
}
