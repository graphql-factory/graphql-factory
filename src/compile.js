/*
 * Expand all definitions. The goal is to omit the fields
 * property from the final definition leaving definitions
 * that stand on their own and can be referenced more easily
 * by utils. This also makes troubleshooting types easier
 * a side effect is also a more well defined schema as some
 * omitted properties will be filled in
 */
import * as _ from './utils'

export default function (def) {
  let c = {
    types: {},
    schemas: {}
  }

  // process types
  _.forEach(def.types, (typeDef, typeName) => {
    if (!typeDef.type) {
      c.types[typeName] = { type: 'Object' }
      // build
    } else if (_.isString(typeDef.type)) {
      c.types[typeName] = { type: typeName }
      // build

    } else if (_.isArray(typeDef.type)) {
      _.forEach(typeDef.type, (multiVal) => {
        if (_.isString(multiVal)) {
          let name = multiVal === 'Object' ? typeName : typeName + multiVal
          c.types[name] = { type: multiVal }
          // build
        } else {
          _.forEach(multiVal, (v, k) => {
            if (k === 'Object' && !v) {
              c.types[typeName] = { type: 'Object' }
              // build
            } else if (k !== 'Object' && !v) {
              c.types[typeName + k] = { type: k }
              // build
            } else {
              c.types[v] = { type: k }
              // build
            }
          })
        }
      })
    } else {
      _.forEach(typeDef.type, (multiVal, multiName) => {
        if (multiName === 'Object' && !multiVal) {
          c[typeName] = { type: multiName }
          // build
        } else if (multiName !== 'Object' && !multiVal) {
          c[typeName + multiName] = { type: multiName }
          // build
        } else {
          c[multiVal] = { type: multiName }
          // build
        }
      })
    }
  })
}