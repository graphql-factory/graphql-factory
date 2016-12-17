import _ from '../utils/index'
import { TYPE_ALIAS, HAS_FIELDS, OBJECT, ENUM } from '../types/constants'

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
    this.moveSchema()
    this.normalizeTypes()
    console.log(JSON.stringify(this.compiled.types, null, '  '))
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
  }

  normalizeTypes () {
    let types = this.compiled.types

    _.forEach(this.definition.types, (_typeDef, name) => {
      if (!_.isHash(_typeDef)) return console.error(`${name} type definition is not an object`)
      let { type } = _typeDef

      switch (_.typeOf(type)) {
        case 'UNDEFINED':
          return types[name] = { type: OBJECT, _typeDef }

        case 'STRING':
          return types[name] = { type, _typeDef }

        case 'ARRAY':
          _.forEach(type, (multi) => {
            if (_.isString(multi)) return types[multi === OBJECT ? name : `${name}${multi}`] = { type, _typeDef }
            _.forEach(multi, (v, k) => {
              if (k === OBJECT && !v) return types[name] = { type: OBJECT, _typeDef }
              else if (k !== OBJECT && !v) return types[name] = { type: k, _typeDef }
              return types[v] = { type: k, _typeDef }
            })
          })
          break

        default:
          _.forEach(type, (multi, mName) => {
            if (mName === OBJECT && !multi) return types[name] = { type: mName, _typeDef }
            else if (mName !== OBJECT && !multi) return types[`${name}${mName}`] = { type: mName, _typeDef }
            return types[multi] = { type: mName, _typeDef }
          })
          break
      }
    })
  }

  mergeBase () {
    _.forEach(this.compiled.types, (definition, name) => {
      let { type, _typeDef } = definition
      let typeDef = _.omit(_typeDef, 'type')
      delete definition._typeDef

      if (!hasFields(type)) {
        _.merge(definition, typeDef)
        if (getShortType(type) === ENUM) {
          let { values } = definition
          _.forEach(values, (v, k) => {
            if (!_.isHash(v)) values[k] = { value: v }
          })
        }
        return true
      }

    })
  }
}