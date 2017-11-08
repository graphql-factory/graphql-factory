import _ from 'lodash'
import Translator from './translate'
import { parse, print, Kind } from 'graphql'
import { constructorName, definitionKey, isHash } from './util'
import { INVALID_FN_NAMES } from './const'

export const CAN_MERGE = [
  'context',
  'types',
  'schemas',
  'functions',
  'directives',
  'functionMap',
  'warnings',
  'before',
  'after',
  'error'
]

export default class GraphQLFactoryDefinition {
  constructor (factory) {
    this.factory = factory
    this.context = {}
    this.types = {}
    this.schemas = {}
    this.functions = {}
    this.directives = {}
    this.functionMap = {}
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

    switch (constructorName(args[0])) {
      case 'String':
        this._processDefinition.apply(this, args)
        break

      case 'Function':
        this._processFunction.apply(this, args)
        break

      case 'Object':
      case 'GraphQLFactoryDefinition':
        this._processFactoryDefinition.apply(this, args)
        break

      default:
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
  build (options) {
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
    const store = _.get(this, [key])
    if (!key) throw new Error(`Invalid Kind "${kind}"`)

    if (Array.isArray(store)) {
      store.push(value)
    } else if (!this[key][name]) {
      store[name] = value
    } else {
      this.warnings.push(`${kind} "${name}" has already been added`)
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
  _processFactoryDefinition (...args) {
    this.merge(new Translator(this.factory).translate(args[0]))
  }

  /**
   * Processes a definition string an optional functionMap, schemaName
   * @param args
   * @private
   */
  _processDefinition (...args) {
    const [ source, functionMap, schemaName ] = args

    if (!_.isString(source) || source === '') {
      throw new Error('source must be String')
    }

    const { definitions } = parse(source)
    let _functionMap = functionMap
    let _name = schemaName

    // check for name as second argument
    if (_.isString(functionMap)) {
      _name = functionMap
      _functionMap = {}
    }

    // merge the function map
    if (isHash(_functionMap)) {
      _.merge(this.functionMap, _functionMap)
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