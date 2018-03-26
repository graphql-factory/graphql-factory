import { Useable } from './Useable';
import { SchemaBacking } from '../backing/ScalarBacking';

export class SchemaBackingUseable extends Useable {
  constructor(definition) {
    super(definition);
  }
  _isUsable(backing) {
    return backing instanceof SchemaBacking;
  }
  _use(backing) {
    backing.validate();
    this.definition.merge(backing);
  }
}
