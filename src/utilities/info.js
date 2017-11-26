import { extractDirectives } from './deconstruct';


export function fieldPath(info) {
  let current = info.path;
  const path = [ current.key ];
  while(current.prev) {
    current = current.prev;
    if (typeof current.key !== 'number') {
      path.push(current.key);
    }
  }
  return path.reverse();
}

export function directiveMap(info) {
  return reduce(info.schema.getDirectives(), (m, directive) => {
    m[directive.name] = directive;
    return m;
  }, Object.create(null));
}

export function isRootResolver(info) {
  return !info.path.prev;
}

export function operationType(info) {
  return info.operation.operation;
}

export function directiveTree(info) {
  const tree = Object.create(null);
  const schema = info.schema;
  const schemaDirectives = extractDirectives(schema.astNode);
  return schemaDirectives;
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
