import { lodash as _ } from '../../jsutils';

export function merge(target, source) {
  _.noop(source);
  return target;
}
