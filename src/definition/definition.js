import _ from 'lodash'
import Plugin from 'graphql-factory-plugin'
import basePlugins from '../plugins'
import EventEmitter from 'events'
import Expander from './expand'
import Decomposer from './decompose'
import Middleware from './middleware'
import { constructorName } from '../common/util'
import {
  BEFORE_MIDDLEWARE,
  AFTER_MIDDLEWARE,
  ERROR_MIDDLEWARE
} from '../common/const'

export default class GraphQLFactoryDefinition extends EventEmitter {
  constructor () {
    super()
    this._context = {}
    this._functions = {}
    this._types = {}
    this._schemas = {}
    this._before = []
    this._after = []
    this._error = []
    this._pluginRegistry = {}
  }

  /**
   * Adds before middleware
   * @param middleware
   * @param timeout
   */
  before (middleware, timeout) {
    const mw = middleware instanceof Middleware
      ? middleware
      : new Middleware(BEFORE_MIDDLEWARE, middleware, timeout)
    this._before.push(mw)
    return this
  }

  /**
   * Adds after middleware
   * @param middleware
   * @param timeout
   */
  after (middleware, timeout) {
    const mw = middleware instanceof Middleware
      ? middleware
      : new Middleware(AFTER_MIDDLEWARE, middleware, timeout)
    this._after.push(mw)
    return this
  }

  /**
   * Adds error middleware
   * @param middleware
   * @param timeout
   */
  error (middleware, timeout) {
    const mw = middleware instanceof Middleware
      ? middleware
      : new Middleware(ERROR_MIDDLEWARE, middleware, timeout)
    this._error.push(mw)
    return this
  }

  /**
   * Creates a copy of the current definition
   * @returns {GraphQLFactoryDefinition}
   */
  clone () {
    return new GraphQLFactoryDefinition().use({
      context: _.assign({}, this._context),
      functions: _.assign({}, this._functions),
      types: _.assign({}, this._types),
      schemas: _.assign({}, this._schemas),
      before: this._before.slice(),
      after: this._after.slice(),
      error: this._error.slice()
    })
  }

  /**
   * Adds the definition, schema, type, etc. to the definition
   * @param obj
   * @param name
   */
  use (obj, name) {
    const structName = constructorName(obj)
    switch (structName) {
      case 'String':
        const p = _.get(basePlugins, `["${obj}"]`)
        if (p && p instanceof Plugin) {
          this._registerPlugin(p)
        } else {
          throw new Error('GraphQLFactoryUserError: Invalid plugin')
        }
        break

      // definition objects
      case 'Object':
      case 'GraphQLFactoryDefinition':
        this._mergeDefinition(
          new Expander().expand(obj)
        )
        break

      // types that require a name parameter
      case 'GraphQLSchema':
      case 'Function':
        if (!name || !_.isString(name)) {
          throw new Error('GraphQLFactoryUseError: '
            + structName + ' requires a name')
        }
        structName === 'Function'
          ? this._functions[name] = obj
          : this._mergeDefinition(
            new Decomposer().decompose(obj, name)
          )
        break

      // all other objects should attempt decomposition
      default:
        // check for instance of plugin
        if (obj && obj instanceof Plugin) {
          this._registerPlugin(obj)
          break
        }

        try {
          this._mergeDefinition(
            new Decomposer().decompose(obj)
          )
        } catch (err) {
          throw new Error('GraphQLFactoryUseError: '
            + structName + 'can not be decomposed into '
            + 'a factory definition')
        }
        break
    }
    return this
  }

  /**
   * Registers a new plugin
   * @param plugin
   * @private
   */
  _registerPlugin (plugin) {
    if (plugin.name && !_.has(this._pluginRegistry, `["${plugin.name}"]`)) {
      this._pluginRegistry[plugin.name] = plugin
      this._mergeDefinition(plugin)
      if (_.isFunction(plugin.install)) plugin.install(this)
    }
  }

  /**
   * Merges a definition into the current definition
   * @param definition
   * @private
   */
  _mergeDefinition (definition) {
    const {
      context,
      functions,
      types,
      schemas,
      before,
      after,
      error
    } = definition
    _.assign(this._context, context)
    _.assign(this._functions, functions)
    _.assign(this._types, types)
    _.assign(this._schemas, schemas)
    this._before = _.union(this._before, before)
    this._after = _.union(this._after, after)
    this._error = _.union(this._error, error)
  }

  /**
   * Clones the plugin definition
   */
  clone () {
    return _.merge({}, this.plugin)
  }

  /**
   * Calls has on the definition
   * @param keyPath
   */
  has (keyPath) {
    return _.has(this, keyPath)
  }

  /**
   * gets a keypath from the definition
   * @param keyPath
   */
  get (keyPath) {
    return _.get(this, keyPath)
  }

  /**
   * Sets a keypath on the definition
   * @param keyPath
   * @param value
   */
  set (keyPath, value) {
    _.set(this, keyPath, value)
  }

  /**
   * Returns boolean if the plugin is registered
   * @param name
   * @returns {*}
   */
  hasPlugin (name) {
    return this.has(`_pluginRegistry["${name}"]`)
  }

  /**
   * Returns boolean if the type has been added
   * @param typeName
   * @returns {*}
   */
  hasType (typeName) {
    return this.has(`_types["${typeName}"]`)
  }

  /**
   * Gets a type definition from the definition
   * @param typeName
   * @returns {*}
   */
  getType (typeName) {
    return this.get(`_types["${typeName}"]`)
  }

  /**
   * Returns a definition object
   * @returns {{functions: *, types: *, schemas: *}}
   */
  get definition () {
    return {
      functions: this._functions,
      types: this._types,
      schemas: this._schemas
    }
  }

  /**
   * Returns a new plugin instance
   * @returns {{globals: *, functions: *, types: *, schemas: *}}
   */
  get plugin () {
    const p = new Plugin(
      'CustomGraphQLFactoryPlugin',
      this._context,
      this._functions,
      this._types,
      this._schemas
    )

    // add any middleware in the install
    p.install = function (def) {
      _.forEach(this._before, mw => def.before(mw))
      _.forEach(this._after, mw => def.after(mw))
      _.forEach(this._error, mw => def.error(mw))
    }

    return p
  }
}