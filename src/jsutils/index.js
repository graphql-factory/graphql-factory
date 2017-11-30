import get from './get';
import getFieldTypeLocation from './getFieldTypeLocation';
import isHashLike from './isHashLike';
import promiseReduce from './promiseReduce';
import set from './set';
import cloneDeep from './cloneDeep';

export { forEach } from './forEach';
export { reduce } from './reduce';
export { map } from './map';
export { intersection } from './intersection.js';
export { indent } from './indent';
export { union } from './union';
export { merge } from './merge';
export { promiseMap } from './promiseMap';
export { noop } from './noop';

export {
  get,
  set,
  getFieldTypeLocation,
  isHashLike,
  promiseReduce,
  cloneDeep
};
export {
  getPromise,
  promiseForObject
} from './promise';
export {
  isObject,
  assertObject
} from './assertions';
