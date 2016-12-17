import _ from './utils/index'
import compiler from './compiler'

export default class GraphQLFactoryDefinition {
  constructor (definition = {}) {
    let { globals, fields, functions, types, schemas, externalTypes } = definition
    this.globals = globals || {}
    this.fields = fields || {}
    this.functions = functions || {}
    this.types = types || {}
    this.schemas = schemas || {}
    this.externalTypes = externalTypes || {}
  }

  merge (definition = {}) {
    let { globals, fields, functions, types, schemas, externalTypes } = definition
    _.merge(this.globals, globals || {})
    _.merge(this.fields, fields || {})
    _.merge(this.functions, functions || {})
    _.merge(this.types, types || {})
    _.merge(this.schemas, schemas || {})
    _.merge(this.externalTypes, externalTypes || {})
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

  hasType (typeName) {
    return this.has(`types["${typeName}"]`)
  }

  getType (typeName) {
    return this.has(`types["${typeName}"]`)
  }

  hasExtType (typeName) {
    return this.has(`externalTypes["${typeName}"]`)
  }

  getExtType (typeName) {
    return this.has(`externalTypes["${typeName}"]`)
  }

  compile () {
    let { fields, types, schemas } = compiler(this.plugin)
    this.fields = fields || {}
    this.types = types || {}
    this.schemas = schemas || {}
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