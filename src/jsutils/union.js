export function union(...args) {
  const u = args.reduce((result, item) => {
    return Array.isArray(item) ? result.concat(item) : result;
  }, []);
  return [ ...new Set(u) ];
}
