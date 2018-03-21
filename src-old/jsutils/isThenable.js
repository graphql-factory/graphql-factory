import * as _ from './lodash.custom';

export function isThenable(obj) {
  return _.isFunction(_.get(obj, 'then'));
}
