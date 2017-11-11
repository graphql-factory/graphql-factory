import _ from '../common/lodash.custom'
import Plugin from 'graphql-factory-plugin'
import Translator from '../translate/language'
import Backing from '../generate/backing'
import buildMiddleware from '../middleware/build'
import { parse, print, Kind } from 'graphql'
import { constructorName, definitionKey, isHash } from '../common/util'

export const CAN_MERGE = [
  'context',
  'types',
  'schemas',
  'functions',
  'plugins',
  'directives',
  'warnings',
  '_beforeBuild',
  '_afterBuild',
  '_buildError'
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
    this.directives = {}
    this._beforeBuild = []
    this._afterBuild = []
    this.error = null
    this.warnings = []
  }

  /**
   * Adds before build middleware
   * @param handler
   */
  beforeBuild (handler) {
    if (!_.isFunction(handler)) throw new Error('beforeBuild middleware must be function')
    this._beforeBuild = _.union(this._beforeBuild, [ handler ])
  }

  /**
   * Adds after build middleware
   * @param handler
   */
  afterBuild (handler) {
    if (!_.isFunction(handler)) throw new Error('afterBuild middleware must be function')
    this._beforeBuild = _.union(this._beforeBuild, [ handler ])
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
   * Builds a registry
   * @param options
   */
  build () {
    let error = null
    const reg = _.reduce(this.schemas, (registry, schema, name) => {
      if (error) return
      try {
        registry[name] = buildMiddleware(this, schema)
        return registry
      } catch (err) {
        error = err
      }
    }, {})

    if (error) throw error
    return reg
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
   * Looks up a function and throws an error if not found or the
   * value passed was not a function
   * @param fn
   * @returns {*}
   */
  lookupFunction (fn, infoPath) {
    const func = _.isString(fn)
      ? _.get(this, [ 'functions', fn ])
      : fn
    if (!_.isFunction(func)) {
      const infoMsg = infoPath
        ? ' at ' + infoPath
        : ''
      throw new Error('Failed to lookup function "'
        + fn + '"' + infoMsg)
    }
    return func
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
    if (name && !_.has(this.plugins, [ name ])) {
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
