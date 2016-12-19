import _ from '../utils/index'
import FactoryEnumValueConfig from './FactoryEnumValueConfig'

export default function FactoryEnumValueConfigMap (_this, values) {
  try {
    return _.mapValues(values, (value) => {
      return FactoryEnumValueConfig(_this, value)
    })
  } catch (err) {
    console.error('FactoryEnumValueConfigMap', err)
  }
}