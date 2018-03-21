import { pathArray } from './pathArray';

export function getSelection(info) {
  const path = pathArray(info.path);
  let key = null;
  let selections = info.operation.selectionSet.selections;

  while (path.length) {
    key = path.shift();
    const selection = selections.filter(s => {
      return s.name.value === key || (s.alias && s.alias.value === key);
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
