import _ from './lodash.custom'

/**
 * Returns the name of the constructor
 * @param obj
 * @returns {undefined}
 */
export function constructorName (obj) {
  return _.get(obj, 'constructor.name')
}

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
 * Strips away nonnull and list objects to
 * build an info object containing the type
 * @param obj
 * @param info
 * @returns {*}
 */
export function getTypeInfo (obj, info) {
  const _info = info || {
    type: null,
    name: null,
    isList: false,
    isNonNull: false
  }

  switch (constructorName(obj)) {
    case 'GraphQLNonNull':
      _info.isNonNull = true
      return getTypeInfo(obj.ofType, _info)
    case 'GraphQLList':
      _info.isList = true
      return getTypeInfo(obj.ofType, _info)
    default:
      _info.type = obj
      _info.name = obj.name
  }
  return _info
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
export function toObjectType (graphql, str, typeResolver) {
  const nonNullRx = /!$/
  const listRx = /^\[(.+)]$/

  const { GraphQLNonNull, GraphQLList } = graphql
  if (str.match(nonNullRx)) {
    return new GraphQLNonNull(
      toObjectType(graphql, str.replace(nonNullRx, ''), typeResolver)
    )
  } else if (str.match(listRx)) {
    return new GraphQLList(
      toObjectType(graphql, str.replace(listRx, '$1'), typeResolver)
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
 * creates a base def object
 * @param info
 * @returns {{type: [null]}}
 */
export function baseDef (info) {
  const { name, isList, isNonNull } = info
  const def = {
    type: isList ? [ name ] : name
  }
  if (isNonNull) def.nullable = false
  return def
}

/**
 * Determines if the value is a list type def
 * @param value
 * @returns {*|boolean}
 */
export function isListTypeDef (value) {
  return _.isArray(value)
    && value.length === 1
    && value[0]
    && _.isString(value[0])
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
