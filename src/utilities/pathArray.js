export function pathArray(path) {
  if (Array.isArray(path)) {
    return path;
  } else if (!path || typeof path !== 'object' || !path.key) {
    return [];
  }
  let p = path;
  const a = [p.key];
  while (p.prev) {
    p = p.prev;
    a.push(p.key);
  }
  return a.reverse();
}
