export function getTime(nano) {
  if (nano) {
    const [, time] = process.hrtime();
    return time;
  }
  return Date.now();
}
