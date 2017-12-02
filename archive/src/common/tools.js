import _ from './lodash.custom'
import { baseName } from './ast'
import { KindLocation } from './const'
import { getDirectiveValues } from 'graphql'

/**
 * Builds the execution path
 * @param info
 * @returns {Array}
 */
export function executionPath (info) {
  const _path = []
  const { path, operation: { operation } } = info
  let { prev, key } = info.path

  while (_.isString(key)) {
    _path.push(key)
    key = _.get(prev, 'key')
    prev = _.get(prev, 'prev')
  }

  // add the operation
  _path.push(operation)

  // reverse the path since we built it bottom up
  return _path.reverse()
}

/**
 * Gets an execution path with parent type objects
 * @param info
 */
export function executionInfo (info) {
  const {
    schema,
    parentType,
    fieldName,
    operation: { operation },
    path: { prev }
  } = info

  // create an exec info
  return {
    operation,
    schema,
    parentType,
    rootType: schema[`_${operation}Type`],
    isRootResolve: !prev,
    field: _.get(parentType, [ '_fields', fieldName ])
  }
}

/**
 * Returns the parsed directives that are valid at the
 * current location
 * @param info
 * @param astNode
 * @returns {*}
 */
export function filterDirectives2 (info, source) {
  if (!source) return []
  const { schema: { _directives, _typeMap }, variableValues } = info
  const { directives, kind, arguments: args, type } = source
  const loc = KindLocation[kind]

  // reduce the args first
  let results = _.reduce(args, (result, arg) => {
    return result.concat(filterDirectives(info, arg))
  }, []) || []

  // if there is a type, check it for directives
  if (type) {
    const { astNode } = _.get(_typeMap, baseName(type), {})
    results = results.concat(filterDirectives(info, astNode))
  }

  // reduce the directives to the allowed ones
  _.reduce(directives, (result, { name }) => {
    // find the current directive
    const directive = _.find(_directives, d => {
      return d.name === name.value
    })

    // if the directive was found, check the location
    if (directive && _.includes(directive.locations, loc)) {
      result.push({
        name: name.value,
        directive,
        args: getDirectiveValues(directive, source, variableValues),
        location: loc
      })
    }
    return result
  }, results)

  return results
}

export function mapOperationDirectives (info) {
  const { operation } = info
  _.noop(operation)
  // console.log(operation)
  return []
}

/**
 * Filters the directives by allowed location
 * @param info
 * @param source
 * @returns {*}
 */
export function filterDirectives (info, source) {
  if (!source) return []
  const { schema: { _directives, _typeMap }, variableValues } = info
  const { directives, kind, type } = source
  const location = KindLocation[kind]
  let results = []

  // if there is a type, check it for directives
  if (!!type) {
    const { astNode } = _.get(_typeMap, baseName(type), {})
    results = filterDirectives(info, astNode)
  }

  // reduce the directives to the allowed ones
  return _.reduce(directives, (result, { name: { value: name } }) => {
    // find the current directive
    const directive = _.find(_directives, d => {
      return d.name === name
    })

    // if the directive was found, check the location
    if (_.includes(_.get(directive, 'locations', []), location)) {
      const args = getDirectiveValues(directive, source, variableValues)
      result.push({ name, directive, args, location })
    }
    return result
  }, results)
}

export function operationDirectives (info) {
  const { operation } = info
  console.log(operation)
}

export function reduceDirectives (info) {
  operationDirectives(info)
  const { schema, rootType, parentType, isRootResolve, field } = executionInfo(info)
  const rootDirectives = filterDirectives(info, schema.astNode)
    .concat(filterDirectives(info, rootType.astNode))

  // if not the root resolve, get the field directives and
  if (!isRootResolve) {
    return rootDirectives
      .concat(filterDirectives(info, parentType.astNode))
      .concat(filterDirectives(info, field.astNode))
  }

  // root resolves
  return rootDirectives
    .concat(filterDirectives(info, field.astNode))
}
