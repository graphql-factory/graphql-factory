/**
 * List of invalid function names to register
 * Invalid because they can be the field name and prone to duplicate
 * @type {[string,string,string,string,string,string,string]}
 */
export const INVALID_FN_NAMES = [
  '',
  'resolve',
  'isTypeOf',
  'serialize',
  'parseValue',
  'parseLiteral',
  'resolveType'
]