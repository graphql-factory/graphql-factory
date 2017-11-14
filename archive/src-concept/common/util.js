import _ from './lodash.custom'
import { GraphQLNonNull, GraphQLList } from 'graphql'

/**
 * Returns the name of the constructor
 * @param obj
 * @returns {undefined}
 */
export function constructorName (obj) {
  return _.get(obj, 'constructor.name')
}

/**
 * Returns a value if the current one is nil
 * @param type
 * @param value
 * @param _default
 * @returns {*}
 */
export function ensureValue (type, value, _default) {
  switch (type) {
    case 'object':
      return value && _.isObject(value)
        ? value
        : _default
    case 'array':
      return _.isArray(value)
        ? value
        : _default
    default:
      return value || _default
  }
}

/**
 * Converts a graphql object into a type string
 * @param obj
 * @param str
 * @returns {*|string}
 */
export function toTypeString (obj, str) {
  const interop = '{{TYPE_NAME}}'
  let name = str || interop

  switch (constructorName(obj)) {
    case 'GraphQLNonNull':
      name = name === interop
        ? `${name}!`
        : name.replace(interop, `${interop}!`)
      return toTypeString(obj.ofType, name)

    case 'GraphQLList':
      name = name.replace(interop, `[${interop}]`)
      return toTypeString(obj.ofType, name)

    default:
      name = name.replace(interop, obj.name)
      break
  }

  return name
}

/**
 * Converts a type string into a new object
 * @param graphql
 * @param str
 * @param typeResolver
 * @returns {*}
 */
export function toObjectType (str, typeResolver) {
  const nonNullRx = /!$/
  const listRx = /^\[(.+)]$/

  if (str.match(nonNullRx)) {
    return new GraphQLNonNull(
      toObjectType(str.replace(nonNullRx, ''), typeResolver)
    )
  } else if (str.match(listRx)) {
    return new GraphQLList(
      toObjectType(str.replace(listRx, '$1'), typeResolver)
    )
  }
  return typeResolver(str)
}

/**
 * Recursively gets the base type
 * @param obj
 * @returns {*}
 */
export function getBaseType (obj) {
  return obj.ofType
    ? getBaseType(obj.ofType)
    : obj
}

/**
 * Determines if the value is a string with a value
 * @param value
 * @returns {*}
 */
export function valueString (value) {
  return _.isString(value) && value !== ''
}

/**
 * Returns the return value of a thunk
 * or just the value if not a thunk
 * @param thunk
 * @returns {*}
 */
export function resolveThunk (thunk) {
  return _.isFunction(thunk)
    ? thunk()
    : thunk
}

/**
 * Performs a check on the field and returns an error if failed
 * @param fieldType
 * @param field
 */
export function assertField (fieldType, fieldTypeName, typeName, field, fieldKey) {
  let error = false
  switch (fieldType) {
    case 'object':
      if (!field
        || _.isArray(field)
        || !_.isObject(field)
        || !_.keys(field).length) {
        error = true
      }
      break
    case 'array':
      if (!field || !_.isArray(field) || !field.length) error = true
      break
    case 'function':
      if (!_.isFunction(field)) error = true
      break
    default:
      break
  }

  return !error
    ? null
    : new Error('GraphQLFactoryExpandError: '
      + 'Missing ' + fieldKey + ' for ' + fieldTypeName
      + ' "' + typeName + '"')
}

/**
 * Creates a string with all words capitalized
 * @returns {string|*}
 */
export function capitalCase () {
  return _.map([ ...arguments ], _.capitalize).join('')
}
