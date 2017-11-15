export default function isHashLike(obj) {
  return typeof obj === 'object' &&
    obj !== null &&
    !Array.isArray(obj) &&
    !(obj instanceof Date);
}
