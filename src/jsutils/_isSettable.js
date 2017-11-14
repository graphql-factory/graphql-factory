// @flow
export default function _isSettable (value) {
  return (typeof value === 'object' && value !== null) ||
    typeof value === 'function' ||
    Array.isArray(value)
}