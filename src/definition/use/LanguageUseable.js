import { parse } from 'graphql';
import { Useable } from './Useable';
import { astToFactoryDefinition } from '../../utilities';
import { FILE_EXT_RX } from '../const';

export class LanguageUseable extends Useable {
  constructor(definition) {
    super(definition);
  }
  _isUsable(language) {
    return (
      language && typeof language === 'string' && !language.match(FILE_EXT_RX)
    );
  }
  _use(language) {
    const ast = parse(language);
    const def = astToFactoryDefinition(ast);
    this.definition.merge(def);
  }
}
