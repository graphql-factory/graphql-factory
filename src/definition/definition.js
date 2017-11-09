import _ from 'lodash'
import Plugin from 'graphql-factory-plugin'
import Translator from '../translate/language'
import Backing from '../types/backing'
import Middleware from '../types/middleware'
import { parse, print, Kind } from 'graphql'
import { constructorName, definitionKey, isHash } from '../common/util'
import {
  INVALID_FN_NAMES,
  ERROR_MIDDLEWARE,
  AFTER_MIDDLEWARE,
  BEFORE_MIDDLEWARE
} from '../common/const'

export const CAN_MERGE = [
  'context',
  'types',
  'schemas',
  'functions',
  'plugins',
  'directives',
  'warnings',
  'before',
  'after',
  'error'
]

export default class GraphQLFactoryDefinition {
  constructor (factory) {
    this.factory = factory
    this.backing = new Backing()
    this.context = {}
    this.types = {}
    this.schemas = {}
    this.functions = {}
    this.plugins = {}
    this.directives = []
    this.error = null
    this.warnings = []
    this.before = []
    this.after = []
    this.error = []
  }

  /**
   * adds definition fragments to the definition
   * @param args
   */
  use (...args) {
    if (!args.length) throw new Error('use requires at least 1 argument')
    const arg0 = args[0]
    switch (constructorName(arg0)) {
      case 'String':
        this._processDefinition(...args)
        break

      case 'Function':
        this._processFunction(...args)
        break

      case 'Object':
      case 'GraphQLFactoryDefinition':
        this._processFactoryDefinition(...args)
        break

      default:
        // check for plugin
        if (arg0 instanceof Plugin || _.isFunction(_.get(arg0, 'install'))) {
          this._processPlugin(...args)
        } else {
          throw new Error('Unable to process use value')
        }
        break
    }

    // check for error which can be set by private methods
    if (this.error instanceof Error) {
      throw this.error
    }

    return this
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
    this.before.push(mw)
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
    this.after.push(mw)
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
    this.error.push(mw)
    return this
  }

  /**
   * Builds a registry
   * @param options
   */
  build () {
    return _.reduce(this.schemas, (registry, schema, name) => {
      registry[name] = schema.build(this)
      return registry
    }, {})
  }


  /**
   * Merges the merge-able fields
   * @param definition
   * @returns {GraphQLFactoryDefinition}
   */
  merge (definition) {
    // merge the backing
    this.backing.merge(definition.backing)

    // merge the rest
    _.forEach(CAN_MERGE, key => {
      const target = this[key]
      const source = definition[key]
      if (_.isArray(source) && _.isArray(target)) {
        this[key] = _.union(source, target)
      } else if (isHash(source) && isHash(target)) {
        _.assign(target, source)
      }
    })
    return this
  }

  /**
   * Creates a clone of the definition
   * @returns {GraphQLFactoryDefinition}
   */
  clone () {
    const definition = new GraphQLFactoryDefinition(this.factory)
    definition.error = this.error
    return definition.merge(this)
  }

  /**
   * Adds a kind to the definition if it has not already been added
   * @param kind
   * @param name
   * @param value
   * @private
   */
  addKind (kind, name, value) {
    const key = definitionKey(kind)
    const store = _.get(this, [ key ])
    if (!key) throw new Error(`Invalid Kind "${kind}"`)

    if (Array.isArray(store)) {
      store.push({ name, value })
    } else if (!this[key][name]) {
      store[name] = value
    } else {
      this.warnings.push(`${kind} "${name}" has already been added`)
    }
  }


  /**
   * Adds a plugin to the
   * @param plugin
   * @private
   */
  _processPlugin (plugin) {
    const { name, install } = plugin
    if (name && !_.has(this.plugins, [name])) {
      this.plugins[name] = plugin
      this.merge(plugin)
      this._processFactoryDefinition(plugin)
      if (_.isFunction(install)) install(this.factory)
    }
  }

  /**
   * Adds a function to the function registry
   * @param args
   * @private
   */
  _processFunction (...args) {
    const [ fn, name ] = args

    // validate that its a function
    if (!_.isFunction(fn)) {
      throw new Error('function must be function')
    }

    // allow custom name
    const _name = _.isString(name)
      ? name
      : fn.name

    // ensure the name is valid
    if (_.includes(INVALID_FN_NAMES, _name)) {
      throw new Error('function name is not allowed or missing')
    }

    // add the function
    this.addKind('Function', _name, fn)
  }

  /**
   * Processes a factory definition and merges its contents
   * @param args
   * @private
   */
  _processFactoryDefinition (definition) {
    this.merge(new Translator(this.factory).translate(definition))
  }

  /**
   * Processes a definition string an optional backing, schemaName
   * @param args
   * @private
   */
  _processDefinition (...args) {
    const [ source, backing, schemaName ] = args

    if (!_.isString(source) || source === '') {
      throw new Error('source must be String')
    }

    const { definitions } = parse(source)
    let _backing = backing
    let _name = schemaName

    // check for name as second argument
    if (_.isString(backing)) {
      _name = backing
      _backing = new Backing()
    }

    // merge the function map
    if (_backing instanceof Backing || _.isObject(_backing)) {
      this.backing.merge(_backing)
    }

    // loop through the definitions
    for (const definition of definitions) {
      const kind = _.get(definition, 'kind')

      if (kind === Kind.SCHEMA_DEFINITION) {
        if (!_.isString(_name) || _name === '') {
          throw new Error('Schema definition requires a name argument in use()')
        }
      } else {
        _name = _.get(definition, 'name.value')
      }

      // add the kind
      this.addKind(kind, _name, print(definition))
    }
  }
}
