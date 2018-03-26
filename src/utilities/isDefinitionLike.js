import { lodash as _ } from '../jsutils';
import { DEFINITION_FIELDS } from '../definition/const';

export function isDefinitionLike(object) {
  return _.intersection(_.keys(object), DEFINITION_FIELDS).length > 0;
}
