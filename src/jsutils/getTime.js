export function getTime() {
  const [ , time ] = process.hrtime();
  return time;
}
