import { Useable } from './Useable';

export class UseableUseable extends Useable {
  constructor(definition) {
    super(definition);
  }
  _isUsable(useable) {
    return useable instanceof Useable;
  }
  _use(useable) {
    this.definition._useables.push(useable);
  }
}
