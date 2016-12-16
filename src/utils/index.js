import merge from './lodash.merge'
import litedash from './litedash.dash'

export default merge({}, litedash, {
  merge,
  clone: (obj) => merge({}, obj)
})