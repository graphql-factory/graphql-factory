import _ from '../utils/index'
import FactoryEnumValueConfig from './FactoryEnumValueConfig'

export default function FactoryEnumValueConfigMap (_this, values) {
  return _.mapValues(values, (value) => {
    return FactoryEnumValueConfig(_this, value)
  })
}