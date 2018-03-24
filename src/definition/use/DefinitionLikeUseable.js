import { Useable } from './Useable';
import { lodash as _ } from '../../jsutils';
import { DEFINITION_FIELDS } from '../const';

export class DefinitionLikeUseable extends Useable {
  constructor(definition) {
    super(definition);
  }
  _isUsable(object) {
    return _.intersection(_.keys(object), DEFINITION_FIELDS).length > 0;
  }
  _use(object) {
    this.definition.merge(object);
  }
}
