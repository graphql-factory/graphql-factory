import { isNamedType } from 'graphql';
import { Useable } from './Useable';
import {
  astFromType,
  astToFactoryDefinition,
  extractNamedTypeBacking,
} from '../../utilities';

export class NamedTypeUseable extends Useable {
  constructor(definition) {
    super(definition);
  }
  _isUsable(type) {
    return isNamedType(type);
  }
  _use(type) {
    const backing = extractNamedTypeBacking(type);
    const ast = astFromType(type);
    const definition = astToFactoryDefinition(ast);

    this.definition.merge(backing);
    this.definition.merge(definition);
  }
}
