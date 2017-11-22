export function intersection(...args) {
  if (args.length < 2) {
    return [];
  }
  const source = args.shift();
  const src = Array.isArray(source) ? source : [];

  return src.reduce((intersections, value) => {
    const intersects = args.reduce((state, array) => {
        return Array.isArray(array) ?
          state && array.indexOf(value) !== -1 :
          state;
    }, true);

    if (intersects && intersections.indexOf(value) === -1) {
     intersections.push(value);
    }

    return intersections;
  }, []);
}
