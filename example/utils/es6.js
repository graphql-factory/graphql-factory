import _ from 'lodash'
import { isHash } from '../../src/utils'
import GraphQLCustomDateType from 'graphql-custom-datetype'

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function merge () {
  let args = [...arguments]
  if (args.length === 0) return {}
  else if (args.length === 1) return args[0]
  else if (!_.isObject(args[0])) return {}
  let targetObject = args[0]
  let sources = args.slice(1)

  let _merge = (target, obj) => {
    for (let key in obj) {
      if (!hasOwn(obj, key)) {
        continue
      }

      var oldVal = obj[key]
      var newVal = target[key]

      if (_.isObject(newVal) && _.isObject(oldVal)) {
        target[key] = _merge(newVal, oldVal)
      } else if (Array.isArray(newVal)) {
        target[key] = _.union([], newVal, oldVal)
      } else {
        target[key] = _.clone(oldVal)
      }
    }
    return target
  }


  //  merge each source
  for (let k in sources) {
    if (isHash(sources[k])) _merge(targetObject, sources[k])
  }
  return targetObject
}


console.log('Merge')
console.log(merge({}, { type: GraphQLCustomDateType}))

console.log('Lodash Merge')
console.log(_.merge({}, { type: GraphQLCustomDateType}))

for (let key in GraphQLCustomDateType) {
  if (!Object.prototype.hasOwnProperty.call(GraphQLCustomDateType, key)) {
    console.log('continuing on', key)
    continue
  }
}