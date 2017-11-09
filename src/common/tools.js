import _ from 'lodash'
import { parseAST, typeName } from './ast'
import { Kind } from 'graphql'

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

  while (path.length) {
    const fieldName = path.shift()
    const field = _.get(currentType, [ '_fields', fieldName ])
    execInfo.push(field)
    currentType = field.type
  }

  return execInfo
}

/**
 * Gets a hash of directives
 * @param info
 */
export function mapDirectives (info) {
  const { schema: { _typeMap } } = info
  const directives = {}

  _.forEach(executionInfo(info).reverse(), ({ astNode }) => {
    const { kind, arguments: args, directives: dirs, type } = astNode

    if (kind === Kind.FIELD_DEFINITION) {
      _.forEach(args, arg => {
        _.assign(directives, parseAST(arg.directives))
      })
      const _typeName = typeName(type)
      const typeDirs = _.get(_typeMap, [ _typeName, 'astNode', 'directives' ])
      _.assign(directives, parseAST(typeDirs))
    }
    _.assign(directives, parseAST(dirs))
  })

  return directives
}
