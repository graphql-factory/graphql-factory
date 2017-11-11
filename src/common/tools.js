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
  const path = []
  let { prev, key } = info.path

  while (_.isString(key)) {
    path.unshift(key)
    key = _.get(prev, 'key')
    prev = _.get(prev, 'prev')
  }

  return path
}

/**
 * Gets an execution path with parent type objects
 * @param info
 */
export function executionInfo (info) {
  const { schema, path: { prev, key }, parentType } = info
  const execInfo = []
  const field = _.get(parentType, [ '_fields', key ])

  // if at root resolver, add the schema
  if (!prev) execInfo.push(schema)

  // all other fields add the type and field
  if (parentType) execInfo.push(parentType)
  if (field) execInfo.push(field)

  // return the exec info
  return execInfo
}

/**
 * Returns the parsed directives that are valid at the
 * current location
 * @param info
 * @param astNode
 * @returns {*}
 */
export function filterDirectives (info, source) {
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
 * Gets a hash of directives
 * @param info
 */
export function reduceDirectives (info) {
  return _.reduce(executionInfo(info), (result, nfo) => {
    return result.concat(filterDirectives(info, nfo.astNode))
  }, mapOperationDirectives(info))
}
