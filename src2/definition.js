import _ from 'lodash'
import { constructorName } from './util'
import { parse, print, Kind } from 'graphql'
import Translator from './translate'

/**
 * List of invalid function names to register
 * Invalid because they can be the field name and prone to duplicate
 * @type {[string,string,string,string,string,string,string]}
 */
const INVALID_FN_NAMES = [
  '',
  'resolve',
  'isTypeOf',
  'serialize',
  'parseValue',
  'parseLiteral',
  'resolveType'
]

/**
 * Returns the appropriate definition key to store the
 * definition in
 * @param kind
 * @returns {*}
 */
function definitionKey (kind) {
  switch (kind) {
    case Kind.SCHEMA_DEFINITION:
      return 'schemas'
    case Kind.DIRECTIVE_DEFINITION:
      return 'directives'
    case Kind.TYPE_EXTENSION_DEFINITION:
      return 'extensions'
    case Kind.SCALAR_TYPE_DEFINITION:
    case Kind.OBJECT_TYPE_DEFINITION:
    case Kind.INPUT_OBJECT_TYPE_DEFINITION:
    case Kind.ENUM_TYPE_DEFINITION:
    case Kind.UNION_TYPE_DEFINITION:
    case Kind.INTERFACE_TYPE_DEFINITION:
      return 'types'
    case 'Function':
      return 'functions'
    default:
      return null
  }
}

export default class GraphQLFactoryDefinition {
  constructor (factory) {
    this.factory = factory
    this.context = {}
    this.types = {}
    this.schemas = {}
    this.functions = {}
    this.directives = []
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
        console.log(args[0])
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
   * Adds a kind to the definition if it has not already been added
   * @param kind
   * @param name
   * @param value
   * @private
   */
  addKind (kind, name, value) {
    const key = definitionKey(kind)
    if (!key) throw new Error(`Invalid Kind "${kind}"`)

    const store = this[key]

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

  _processFactoryDefinition (...args) {
    const translated = new Translator(this.factory)
      .translate(args[0])

    console.log(translated)
    console.log('================')
    _.forEach(translated.types, def => console.log(def))
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
    if (_.isObject(_functionMap) && !Array.isArray(_functionMap)) {
      _.merge(this.functionMap, _functionMap)
    }

    // loop through the definitions
    for (const definition of definitions) {
      const kind = _.get(definition, 'kind')

      if (kind == Kind.SCHEMA_DEFINITION) {
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