import _ from './lodash.custom'
import { parseAST, baseName } from './ast'
import { KindLocation } from './const'

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
  const { operation, schema } = info
  const execInfo = [ schema ]
  const path = executionPath(info)
  const operationType = operation.operation
  let currentType = schema[`_${operationType}Type`]
  execInfo.push(currentType)

  for (const fieldName of path) {
    const field = _.get(currentType, [ '_fields', fieldName ])
    execInfo.push(field)
    currentType = _.get(field, 'type')
  }

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
  const { schema: { _directives, _typeMap } } = info
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
  _.reduce(directives, (result, { name, arguments: _args }) => {
    // find the current directive
    const directive = _.find(_directives, d => {
      return d.name === name.value
    })

    // if the directive was found, check the location
    if (directive && _.includes(directive.locations, loc)) {
      result.push({
        directive: name.value,
        args: parseAST(_args),
        location: loc
      })
    }
    return result
  }, results)

  return results
}

/**
 * Gets a hash of directives
 * @param info
 */
export function reduceDirectives (info) {
  return _.reduce(executionInfo(info).reverse(), (result, nfo) => {
    return result.concat(filterDirectives(info, nfo.astNode))
  }, [])
}
