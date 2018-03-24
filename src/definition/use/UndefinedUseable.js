import { Useable } from './Useable';

export class UndefinedUseable extends Useable {
  constructor(definition) {
    super(definition);
  }
  _isUsable(useable) {
    return useable === undefined;
  }
}
