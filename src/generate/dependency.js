import _ from 'lodash'
import { SCALAR_NAMES } from '../common/const'

export default class TypeDependency {
  constructor () {
    this._graph = {}
  }

  /**
   * Adds a dependency to a unique list of dependencies
   * @param type
   * @param dependency
   * @private
   */
  _addDependency(type, dependency) {
    // skip built in scalar types
    if (_.includes(SCALAR_NAMES, dependency)) return
    this._graph[type] = _.union(this._graph[type], [ dependency ])
  }

  /**
   * Gets the dependencies from a fields hash
   * @param fields
   * @param type
   * @private
   */
  _graphFields (fields, graphType) {
    _.forEach(fields, field => {
      const { type, args } = field
      const typeName = _.first(_.castArray(type))
      this._graphFields(args, type)
      this._addDependency(graphType, typeName)
    })
  }

  /**
   * Gets the type dependencies from all of the types
   * @param typeDefinitions
   * @returns {{}|*}
   */
  graph (typeDefinitions, asMap) {
    _.forEach(typeDefinitions, (typeDef, typeName) => {
      const { fields, interfaces, types } = typeDef

      _.forEach(interfaces, i => {
        this._addDependency(typeName, i)
      })

      _.forEach(types, t => {
        this._addDependency(typeName, t)
      })

      this._graphFields(fields, typeName)
    })

    return this._graph
  }
}