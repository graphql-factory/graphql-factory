import _ from '../utils/index'

export default function FactoryEnumValueConfig (_this, val) {
  let { value, deprecationReason, description } = _.isObject(val) ? val : { value: val }

  return {
    value,
    deprecationReason,
    description
  }
}