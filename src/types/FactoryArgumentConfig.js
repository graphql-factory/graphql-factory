import _ from '../utils/index'

export default function FactoryArgumentConfig (_this, arg = {}, rootType) {
  try {
    arg = _.isString(arg) || _.isArray(arg) ? { type: arg } : arg
    let { defaultValue, description } = arg
    let type = _this.resolveType(arg, rootType)

    return {
      type,
      defaultValue,
      description
    }
  } catch (err) {
    console.error('FactoryArgumentConfig', err)
  }
}