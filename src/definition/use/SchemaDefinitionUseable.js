import { Useable } from './Useable';
import { SchemaDefinition } from '../SchemaDefinition';

export class SchemaDefinitionUseable extends Useable {
  constructor(definition) {
    super(definition);
  }
  _isUsable(definition) {
    return definition instanceof SchemaDefinition;
  }
  _use(definition) {
    this.definition.merge(definition);
  }
}
