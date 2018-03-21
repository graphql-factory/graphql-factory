import { lodash as _ } from '../jsutils';
import by from './by';
import enumDirective from './enum';
import id from './id';
import meta from './meta';
import relation from './relation';
import resolve from './resolve';
import typeDef from './typeDef';
import unique from './unique';
import validate from './validate';

export const directives = {
  by,
  enum: enumDirective,
  id,
  meta,
  relation,
  resolve,
  typeDef,
  unique,
  validate,
};

export function mapDirectives(names) {
  return _.pick(directives, names);
}
