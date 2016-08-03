/*
 * Expand all definitions. The goal is to omit the fields
 * property from the final definition leaving definitions
 * that stand on their own and can be referenced more easily
 * by utils. This also makes troubleshooting types easier
 * a side effect is also a more well defined schema as some
 * omitted properties will be filled in
 */
import * as _ from './utils'

export const HAS_FIELDS = ['Object', 'Input', 'Interface']

export const TYPE_MAP = {
  Schema: 'Schema',
  GraphQLSchema: 'Schema',
  Scalar: 'Scalar',
  GraphQLScalarType: 'Scalar',
  Object: 'Object',
  GraphQLObjectType: 'Object',
  Interface: 'Interface',
  GraphQLInterfaceType: 'Interface',
  Union: 'Union',
  GraphQLUnionType: 'Union',
  Enum: 'Enum',
  GraphQLEnumtype: 'Enum',
  Input: 'Input',
  GraphQLInputObjectType: 'Input',
  List: 'List',
  GraphQLList: 'List',
  NonNull: 'NonNull',
  GraphQLNonNull: 'NonNull'
}

function getShortType (type) {
  return _.get(TYPE_MAP, type, null)
}

function hasFields (type) {
  return _.includes(HAS_FIELDS, getShortType(type))
}

// moves objects defined on the schema to the types section and references the type
function moveSchemaObjects (def, c) {
  _.forEach(def.schemas, (schema, schemaName) => {
    let schemaDef = {}
    _.forEach(schema, (field, fieldName) => {
      if (_.isHash(field)) {
        let name = field.name || `${schemaName}${_.capitalize(fieldName)}`
        def.types[name] = field
        schemaDef[fieldName] = name
      } else {
        schemaDef[fieldName] = field
      }
    })
    c.schemas[schemaName] = schemaDef
  })
}


// expands multi types into their own definitions
function expandMultiTypes (def, c, debug) {
  _.forEach(def.types, (typeDef, typeName) => {
    if (!typeDef.type) {
      c.types[typeName] = { type: 'Object', _typeDef: typeDef }
    } else if (_.isString(typeDef.type)) {
      c.types[typeName] = { type: typeDef.type, _typeDef: typeDef }
    } else if (_.isArray(typeDef.type)) {
      _.forEach(typeDef.type, (multiVal) => {
        if (_.isString(multiVal)) {
          let name = multiVal === 'Object' ? typeName : typeName + multiVal
          c.types[name] = { type: multiVal, _typeDef: typeDef }
        } else {
          _.forEach(multiVal, (v, k) => {
            if (k === 'Object' && !v) {
              c.types[typeName] = { type: 'Object', _typeDef: typeDef }
            } else if (k !== 'Object' && !v) {
              c.types[typeName + k] = { type: k, _typeDef: typeDef }
            } else {
              c.types[v] = { type: k, _typeDef: typeDef }
            }
          })
        }
      })
    } else {
      _.forEach(typeDef.type, (multiVal, multiName) => {
        if (multiName === 'Object' && !multiVal) {
          c.types[typeName] = { type: multiName, _typeDef: typeDef }
        } else if (multiName !== 'Object' && !multiVal) {
          c.types[typeName + multiName] = { type: multiName, _typeDef: typeDef }
        } else {
          c.types[multiVal] = { type: multiName, _typeDef: typeDef }
        }
      })
    }
  })
}

// merges extended fields with base config
function mergeExtendedWithBase (def, c, debug) {
  _.forEach(c.types, (obj) => {

    let typeDef = _.omit(obj._typeDef, 'type')

    if (hasFields(obj.type)) {
      obj.fields = obj.fields || {}

      // get the extend fields and the base definition
      let ext = typeDef.extendFields
      let baseDef = _.omit(typeDef, 'extendFields')

      // create a base by merging the current type obj with the base definition
      _.merge(obj, baseDef)

      // examine the extend fields
      if (_.isString(ext)) {
        let e = _.get(def, `fields["${ext}"]`, {})
        _.merge(obj.fields, e)
      } else if (_.isArray(ext)) {
        _.forEach(ext, (eName) => {
          let e = _.get(def, `fields["${eName}"]`, {})
          _.merge(obj.fields, e)
        })
      } else if (_.isHash(ext)) {
        _.forEach(ext, (eObj, eName) => {
          let e = _.get(def, `fields["${eName}"]`, {})
          _.forEach(eObj, (oField, oName) => {
            let extCfg = _.get(e, oName)
            if (extCfg) {
              if (_.isArray(oField) && oField.length > 1) {
                _.forEach(oField, (v, i) => {
                  _.merge(oField[i], extCfg, v)
                })
              } else {
                _.merge(oField, e)
              }
            }
          })
          _.merge(obj.fields, e, eObj)
        })
      }
    } else {
      _.merge(obj, typeDef)

      // create a hash for enum values specified as strings
      if (getShortType(obj.type) === 'Enum') {
        _.forEach(obj.values, (v, k) => {
          if (!_.isHash(v)) obj.values[k] = { value: v }
        })
      }
    }
  })
}

function extendFieldTemplates (c, debug) {
  _.forEach(c.types, (obj, name) => {
    if (obj.fields) {
      let omits = []
      _.forEach(obj.fields, (field, fieldName) => {
        if (_.isArray(field) && field.length > 1) {
          omits.push(fieldName)
          // get the field template
          _.forEach(field, (type, idx) => {
            if (type.name) {
              let fieldBase = _.get(obj, `fields["${type.name}"]`, {})
              obj.fields[type.name] = _.merge({}, fieldBase, _.omit(type, 'name'))
            } else {
              let fieldBase = _.get(obj, `fields["${idx}"]`, {})
              obj.fields[`${fieldName}${idx}`] = _.merge({}, fieldBase, type)
            }
          })
        }
      })
      obj.fields = _.omit(obj.fields, omits)
    }
  })
}

function setConditionalTypes (c, debug) {
  _.forEach(c.types, (obj) => {
    if (obj.fields) {
      let omits = []
      _.forEach(obj.fields, (field, fieldName) => {
        if (_.isHash(field)) {
          if (!field.type) {
            if (field[obj.type]) obj.fields[fieldName] = field[obj.type]
            else omits.push(fieldName)
          } else if (field.omitFrom) {
            let omitFrom = _.isArray(field.omitFrom) ? field.omitFrom : [field.omitFrom]
            if (_.includes(omitFrom, obj.type)) omits.push(fieldName)
            else obj.fields[fieldName] = _.omit(obj.fields[fieldName], 'omitFrom')
          }
        } else {
          obj.fields[fieldName] = { type: field }
        }
      })
      obj.fields = _.omit(obj.fields, omits)
    }
  })
}


export default function (definition, debug) {
  let def = _.clone(definition)
  let c = {
    globals: def.globals || {},
    fields: def.fields || {},
    functions: def.functions || {},
    externalTypes: def.externalTypes || {},
    types: {},
    schemas: {}
  }

  // first check if schema fields are objects, if they are, move them to the types
  moveSchemaObjects(def, c, debug)

  // expand multi-types
  expandMultiTypes(def, c, debug)

  // merge extended fields and base configs
  mergeExtendedWithBase(def, c, debug)

  // extend field templates
  extendFieldTemplates(c, debug)

  // omit fields and set conditional types
  setConditionalTypes(c, debug)

  return c
}