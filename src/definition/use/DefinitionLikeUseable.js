import { Useable } from './Useable';
import { isDefinitionLike } from '../../utilities';

export class DefinitionLikeUseable extends Useable {
  constructor(definition) {
    super(definition);
  }
  _isUsable(object) {
    return isDefinitionLike(object);
  }
  _use(object) {
    this.definition.merge(object);
  }
}
