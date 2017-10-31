import _ from '../common/lodash.custom'
import Plugin from 'graphql-factory-plugin'
import Expander from './expand'
import Decomposer from './decompose'
import Middleware from './middleware'
import Language from './language'
import { constructorName, capitalCase } from '../common/util'
import {
  OBJECT,
  BEFORE_MIDDLEWARE,
  AFTER_MIDDLEWARE,
  ERROR_MIDDLEWARE
} from '../common/const'

export default class GraphQLFactoryDefinition {
  constructor (factory) {
    this._factory = factory
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
   * @param options
   * @returns {GraphQLFactoryDefinition}
   */
  before (middleware, options) {
    const mw = middleware instanceof Middleware
      ? middleware
      : new Middleware(BEFORE_MIDDLEWARE, middleware, options)
    this._before.push(mw)
    return this
  }

  /**
   * Adds after middleware
   * @param middleware
   * @param options
   * @returns {GraphQLFactoryDefinition}
   */
  after (middleware, options) {
    const mw = middleware instanceof Middleware
      ? middleware
      : new Middleware(AFTER_MIDDLEWARE, middleware, options)
    this._after.push(mw)
    return this
  }

  /**
   * Adds error middleware
   * @param middleware
   * @param options
   * @returns {GraphQLFactoryDefinition}
   */
  error (middleware, options) {
    const mw = middleware instanceof Middleware
      ? middleware
      : new Middleware(ERROR_MIDDLEWARE, middleware, options)
    this._error.push(mw)
    return this
  }

  /**
   * Creates a copy of the current definition
   * @returns {GraphQLFactoryDefinition}
   */
  clone () {
    return new GraphQLFactoryDefinition(this._factory).use({
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
  use (obj, name, extension) {
    const structName = constructorName(obj)
    switch (structName) {
      case 'String':
        this._mergeDefinition(
          new Language(this._factory.graphql)
            .build(obj, name, extension)
        )
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
        if (name === '' || !_.isString(name)) {
          throw new Error('GraphQLFactoryUseError: '
            + structName + ' requires a name')
        }
        if (structName === 'Function') {
          this._functions[name] = obj
        } else {
          this._mergeDefinition(
            new Decomposer().decompose(obj, name)
          )
        }
        break

      // all other objects should attempt decomposition
      default:
        // check for instance of plugin or presence of an install function
        if (obj instanceof Plugin || _.isFunction(_.get(obj, 'install'))) {
          this._registerPlugin(obj)
          break
        }

        try {
          this._mergeDefinition(
            new Decomposer().decompose(obj)
          )
        } catch (err) {
          throw new Error('GraphQLFactoryUseError: '
            + structName + ' can not be decomposed into '
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
      if (_.isFunction(plugin.install)) plugin.install(this._factory)
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
   * Exports the definition as a plugin
   * @param name
   * @returns {GraphQLFactoryPlugin}
   */
  export (name) {
    if (!_.isString(name) || name === '') {
      throw new Error('GraphQLFactoryDefinitionError: '
        + 'Exporting definition as a plugin requires a plugin name')
    }
    const p = new Plugin(
      name,
      this.context,
      this.functions,
      this.types,
      this.schemas
  )

    // add any middleware in the install
    p.install = function (def) {
      _.forEach(this._before, mw => def.before(mw))
      _.forEach(this._after, mw => def.after(mw))
      _.forEach(this._error, mw => def.error(mw))
    }

    return p
  }

  /**
   * Combines operation fields into a single object and
   * sets that new object on a new schema definition
   * @param name
   */
  mergeSchemas (name, options) {
    if (!_.isString(name) || name === '') {
      throw new Error('GraphQLFactoryDefinitionError: '
        + 'Merging schemas requires a schema name')
    }

    const { clean } = _.isObject(options) && options
      ? options
      : {}

    const schema = {}

    _.forEach(this._schemas, s => {
      _.forEach(s, (opRef, opType) => {
        // only process operation fields
        if (!_.includes([ 'query', 'mutation', 'subscription' ], opType)) {
          return true
        }
        const singleName = capitalCase(name, opType, 'object')
        const opObj = _.get(this._types, `["${opRef}"]`)
        schema[opType] = singleName

        // create the initial definition
        if (!_.has(this._types, `["${singleName}"]`)) {
          this._types[singleName] = {
            type: OBJECT,
            name: singleName,
            fields: {}
          }
        }

        // assign the fields to the existing def
        // and remove the original type
        _.assign(this._types[singleName], opObj.fields)
        if (clean !== false) {
          _.unset(this._types, `["${opRef}"]`)
        }
      })
    })

    // add the new schema or make it the only
    // depending on the clean argument
    if (clean === false) {
      this._schemas[name] = schema
    } else {
      this._schemas = {
        [name]: schema
      }
    }

    // return the definition
    return this
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
   * Context getter
   * @returns {{}|*}
   */
  get context () {
    return this._context
  }

  /**
   * Types getter
   * @returns {{}|*}
   */
  get types () {
    return this._types
  }

  /**
   * Schemas getter
   * @returns {{}|*}
   */
  get schemas () {
    return this._schemas
  }

  /**
   * Functions getter
   * @returns {{}|*}
   */
  get functions () {
    return this._functions
  }

  /**
   * Returns a definition object
   * @returns {{functions: *, types: *, schemas: *}}
   */
  get definition () {
    return {
      functions: this.functions,
      types: this.types,
      schemas: this.schemas
    }
  }
}
