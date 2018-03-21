export function indent(count = 1, value = '  ') {
  return new Array(count).fill(value).join('');
}
