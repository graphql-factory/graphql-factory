import { lodash as _ } from '../jsutils';

export function fieldPath(info, includeIndexes) {
  let current = info.path || _.get(info, [ 'fieldInfo', 'path' ]);
  const path = [ current.key ];
  while (current.prev) {
    current = current.prev;
    if (typeof current.key !== 'number' || includeIndexes) {
      path.push(current.key);
    }
  }
  return path.reverse();
}

export function makePath(info, options) {
  const opts = Object.assign({}, options);
  const prepend = Array.isArray(opts.prepend) ? opts.prepend : [];
  const path = fieldPath(info, opts.includeIndexes);
  return prepend.concat(path).reduce((prev, key) => {
    return { prev, key };
  }, undefined);
}

export function isRootResolver(info) {
  return !info.path.prev;
}

export function isFirstSelection(info) {
  const firstSel = info.operation.selectionSet.selections[0];
  return firstSel.name.value === info.path.key ||
    (firstSel.alias && firstSel.alias.value === info.path.key);
}

export function operationType(info) {
  return info.operation.operation;
}

export function getSelection(info) {
  const path = fieldPath(info);
  let key = null;
  let selections = info.operation.selectionSet.selections;

  while (path.length) {
    key = path.shift();
    const selection = selections.filter(s => {
      return s.name.value === key ||
        (s.alias && s.alias.value === key);
    });

    if (!selection.length) {
      throw new Error('Unable to determine selection');
    }
    if (!path.length) {
      return selection[0];
    }
    selections = selection[0].selectionSet.selections;
  }
}
