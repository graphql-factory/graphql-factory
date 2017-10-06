import _ from './utils/index'
import EventEmitter from 'events'
import factoryPlugins from './plugins/index'
import GraphQLFactoryCompiler from './GraphQLFactoryCompiler'

const DEFAULT_MIDDLEWARE_TIMEOUT = 5000

export default class GraphQLFactoryDefinition extends EventEmitter {
  constructor (definition = {}, options = {}) {
    super()
    const { plugin } = options
    const { globals, fields, functions, types, schemas, externalTypes } = definition
    this.globals = globals || {}
    this.fields = fields || {}
    this.functions = functions || {}
    this.types = types || {}
    this.schemas = schemas || {}
    this.externalTypes = externalTypes || {}
    this.pluginRegistry = {}
    this._middleware = {
      before: [],
      after: [],
      beforeTimeout: DEFAULT_MIDDLEWARE_TIMEOUT,
      afterTimeout: DEFAULT_MIDDLEWARE_TIMEOUT
    }
    this.registerPlugin(plugin)
  }

  merge (definition = {}) {
    const {
      globals,
      fields,
      functions,
      types,
      schemas,
      externalTypes
    } = definition

    // assign is used to prevent overwriting instantiated classes
    Object.assign(this.globals, globals || {})
    _.merge(this.fields, fields || {})
    _.merge(this.functions, functions || {})
    _.merge(this.types, types || {})
    _.merge(this.schemas, schemas || {})
    _.merge(this.externalTypes, externalTypes || {})
    return this
  }

  registerPlugin (plugins = []) {
    _.forEach(_.ensureArray(plugins), plugin => {
      let p = plugin
      // first check for included plugins that can be specified by their string name
      if (_.isString(plugin) && plugin) {
        if (factoryPlugins[plugin]) {
          p = factoryPlugins[plugin]
        } else {
          this.emit('log', {
            source: 'types',
            level: 'error',
            error: new Error(`DefinitionError: Plugin "${p}" not found`)
          })
          return true
        }
      }

      const name = _.get(p, 'name', `unnamedPlugin${_.keys(this.pluginRegistry).length}`)
      this.pluginRegistry[name] = p
      this.merge(p)
      if (_.isFunction(p.install)) p.install(this)
    })
    return this
  }

  beforeResolve (middleware) {
    _.forEach(_.ensureArray(middleware), mw => {
      if (_.isFunction(mw)) {
        this._middleware.before = _.union(this._middleware.before, [ mw ])
      }
    })
    return this
  }

  afterResolve (middleware) {
    _.forEach(_.ensureArray(middleware), mw => {
      if (_.isFunction(mw)) {
        this._middleware.after = _.union(this._middleware.after, [ mw ])
      }
    })
    return this
  }

  beforeTimeout (timeout) {
    if (_.isNumber(timeout)) {
      this._middleware.beforeTimeout = Math.ceil(timeout)
    }
    return this
  }

  afterTimeout (timeout) {
    if (_.isNumber(timeout)) {
      this._middleware.afterTimeout = Math.ceil(timeout)
    }
    return this
  }

  processDefinitionHooks () {
    _.forEach(this.pluginRegistry, plugin => {
      const hook = _.get(plugin, 'hooks.definition')
      if (_.isFunction(hook)) hook(this)
    })
    return this
  }

  compile () {
    this.processDefinitionHooks()
    const compiler = new GraphQLFactoryCompiler(this)
    const compiled = compiler.compile()
    const { fields, types, schemas } = compiled
    this.fields = fields || {}
    this.types = types || {}
    this.schemas = schemas || {}
    return compiled
  }

  clone () {
    return _.merge({}, this.plugin)
  }

  has (keyPath) {
    return _.has(this, keyPath)
  }

  get (keyPath) {
    return _.get(this, keyPath)
  }

  set (keyPath, value) {
    _.set(this, keyPath, value)
  }

  hasPlugin (name) {
    return this.has(`pluginRegistry["${name}"]`)
  }

  hasType (typeName) {
    return this.has(`types["${typeName}"]`)
  }

  getType (typeName) {
    return this.get(`types["${typeName}"]`)
  }

  hasExtType (typeName) {
    return this.has(`externalTypes["${typeName}"]`)
  }

  getExtType (typeName) {
    return this.get(`externalTypes["${typeName}"]`)
  }

  get definition () {
    return {
      fields: this.fields,
      functions: this.functions,
      types: this.types,
      schemas: this.schemas,
      externalType: this.externalTypes
    }
  }

  get plugin () {
    return {
      globals: this.globals,
      fields: this.fields,
      functions: this.functions,
      types: this.types,
      schemas: this.schemas,
      externalType: this.externalTypes
    }
  }
}
