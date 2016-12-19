import _ from './utils/index'
import { TYPE_ALIAS, HAS_FIELDS, OBJECT, ENUM } from './types/constants'

function getShortType (type) {
  return _.get(TYPE_ALIAS, type, null)
}

function hasFields (type) {
  return _.includes(HAS_FIELDS, getShortType(type))
}

function toTypeDef (obj) {
  return _.isHash(obj) ? obj : { type: obj }
}

function normalizeArgs (field) {
  _.forEach(field.args, (arg, argName) => {
    field.args[argName] = toTypeDef(arg)
  })
  return field
}

function normalizeType (type) {
  return normalizeArgs(toTypeDef(type))
}

export default class GraphQLFactoryCompiler {
  constructor (definition) {
    this.definition = definition.clone()
    this.compiled = {
      fields: this.definition.fields || {},
      types: {},
      schemas: {}
    }
  }

  compile () {
    return this.moveSchema()
      .normalizeTypes()
      .mergeBase()
      .extendTemplates()
      .conditionalTypes()
      .value()
  }

  value () {
    return this.compiled
  }

  moveSchema () {
    _.forEach(this.definition.schemas, (schema, schemaName) => {
      this.compiled.schemas[schemaName] = _.mapValues(schema, (definition, operation) => {
        if (_.isString(definition)) return definition
        let opName = definition.name || `${schemaName}${_.capitalize(operation)}`
        _.set(this.definition, `types["${opName}"]`, definition)
        return opName
      })
    })
    return this
  }

  normalizeTypes () {
    let types = this.compiled.types

    _.forEach(this.definition.types, (_typeDef, name) => {
      if (!_.isHash(_typeDef)) return console.error(`${name} type definition is not an object`)
      let { type } = _typeDef

      switch (_.typeOf(type)) {
        case 'UNDEFINED':
          types[name] = { type: OBJECT, _typeDef }
          break

        case 'STRING':
          types[name] = { type, _typeDef }
          break

        case 'ARRAY':
          _.forEach(type, (multi) => {
            if (_.isString(multi)) {
              types[multi === OBJECT ? name : `${name}${multi}`] = { type: multi, _typeDef }
            } else {
              _.forEach(multi, (v, k) => {
                if (k === OBJECT && !v) types[name] = { type: OBJECT, _typeDef }
                else if (k !== OBJECT && !v) types[name] = { type: k, _typeDef }
                else types[v] = { type: k, _typeDef }
              })
            }
          })
          break

        default:
          _.forEach(type, (multi, mName) => {
            if (mName === OBJECT && !multi) types[name] = { type: mName, _typeDef }
            else if (mName !== OBJECT && !multi) types[`${name}${mName}`] = { type: mName, _typeDef }
            else types[multi] = { type: mName, _typeDef }
          })
          break
      }
    })
    return this
  }

  mergeBase () {
    let fields = this.compiled.fields
    _.forEach(this.compiled.types, (definition, n) => {
      let { type, _typeDef } = definition
      let { extendFields } = _typeDef

      _.merge(definition, _.omit(_typeDef, ['type', 'extendFields']))
      delete definition._typeDef

      // no type fields
      if (!hasFields(type)) {
        if (getShortType(type) === ENUM) {
          let { values } = definition
          _.forEach(values, (v, k) => {
            if (!_.isHash(v)) values[k] = { value: v }
          })
        }
        return true
      }

      // ensure there is a fields hash
      definition.fields = _.isHash(definition.fields) ? definition.fields : {}

      // type fields
      switch (_.typeOf(extendFields)) {
        case 'STRING':
          _.merge(definition.fields, _.get(fields, `["${extendFields}"]`, {}))
          break

        case 'ARRAY':
          _.forEach(extendFields, (typeName) => {
            _.merge(definition.fields, _.get(fields, `["${typeName}"]`, {}))
          })
          break

        case 'HASH':
          _.forEach(extendFields, (extendDef, name) => {
            let ext = _.get(fields, `["${name}"]`, {})
            _.forEach(extendDef, (field, name) => {
              let config = _.get(ext, name)
              if (!config) return true
              config = normalizeType(config)
              if (_.isArray(field) && field.length > 1) {
                _.forEach(field, (v, i) => {
                  field[i] = _.merge({}, config, normalizeType(v))
                })
                return true
              }
              extendDef[name] = _.merge({}, config, normalizeType(field))
            })
            _.merge(definition.fields, ext, extendDef)
          })
          break

        default:
          break
      }
    })
    return this
  }

  extendTemplates () {
    _.forEach(this.compiled.types, (definition) => {
      let omits = []
      let fieldBase = null
      let { fields } = definition
      if (!fields) return true
      _.forEach(fields, (field, name) => {
        if (_.isArray(field) && field.length > 1) {
          omits.push(name)
          _.forEach(field, (type, idx) => {
            normalizeArgs(type)

            if (type.name) {
              fieldBase = _.get(definition, `fields["${type.name}"]`, {})
              normalizeArgs(fieldBase)
              definition.fields[type.name] = _.merge({}, fieldBase, _.omit(type, 'name'))
              return true
            }

            fieldBase = _.get(definition, `fields["${idx}"]`, {})
            normalizeArgs(fieldBase)
            definition.fields[`${name}${idx}`] = _.merge({}, fieldBase, type)
          })
        }
      })
      definition.fields = _.omit(definition.fields, omits)
    })
    return this
  }

  conditionalTypes () {
    _.forEach(this.compiled.types, (definition) => {
      let omits = []
      let { fields } = definition
      if (!fields) return true

      _.forEach(fields, (field, name) => {
        switch (_.typeOf(field)) {
          case 'HASH':
            let { type, omitFrom } = field
            if (!type) {
              if (field[definition.type]) definition.fields[name] = normalizeType(field[definition.type])
              else omits.push(name)
            } else if (omitFrom) {
              if (_.includes(_.isArray(omitFrom) ? omitFrom : [omitFrom], definition.type)) omits.push(name)
              else fields[name] = normalizeArgs(_.omit(fields[name], 'omitFrom'))
            }
            break

          default:
            definition.fields[name] = { type: field }
            break
        }
      })
      definition.fields = _.omit(definition.fields, omits)
    })
    return this
  }
}