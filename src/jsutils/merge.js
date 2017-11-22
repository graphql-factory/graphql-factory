import { isObject } from './assertions';
import { reduce } from './reduce';
import cloneDeep from './cloneDeep';

function _baseMerge(target, source) {
  if (!isObject(source)) {
    return;
  }
  reduce(source, (tgt, value, key) => {
    if (!tgt.hasOwnProperty(key)) {
      tgt[key] = cloneDeep(value);
    } else {
      const tgtValue = tgt[key];
      if (Array.isArray(value)) {
        tgt[key] = value.map(cloneDeep);
      } else if (Array.isArray(tgtValue)) {
        tgt[key] = cloneDeep(value);
      } else if (isObject(value) && isObject(tgtValue)) {
        _baseMerge(tgtValue, value);
      } else {
        tgt[key] = cloneDeep(value);
      }
    }
    return tgt;
  }, target);
}

export function merge(...args) {
  if (!args.length) {
    return {};
  }
  const target = args.shift();
  if (!isObject(target)) {
    return {};
  }

  while (args.length) {
    const source = args.shift();
    _baseMerge(target, source);
  }

  return target;
}
