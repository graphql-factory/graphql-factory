import _ from './utils'

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

  merge (definition) {

  }
}