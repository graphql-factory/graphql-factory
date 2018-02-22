import { lodash as _ } from '../jsutils';
import belongsTo from './belongsTo';
import by from './by';
import enumDirective from './enum';
import has from './has';
import id from './id';
import meta from './meta';
import resolve from './resolve';
import typeDef from './typeDef';
import unique from './unique';
import validate from './validate';

export const directives = {
  belongsTo,
  by,
  enum: enumDirective,
  has,
  id,
  meta,
  resolve,
  typeDef,
  unique,
  validate
};

export function mapDirectives(names) {
  return _.pick(directives, names);
}
