import _ from '../utils/index'

export default function FactoryEnumValueConfig (_this, val) {
  try {
    let { value, deprecationReason, description } = _.isObject(val) ? val : { value: val }

    return {
      value,
      deprecationReason,
      description
    }
  } catch (err) {
    console.error('FactoryEnumValueConfig', err)
  }
}