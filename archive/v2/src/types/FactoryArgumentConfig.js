import _ from '../utils/index'

export default function FactoryArgumentConfig (_this, arg = {}, rootType) {
  try {
    const a = _.isString(arg) || _.isArray(arg)
      ? { type: arg }
      : arg
    const { defaultValue, description } = a
    const type = _this.resolveType(a, rootType)

    return {
      type,
      defaultValue,
      description
    }
  } catch (err) {
    _this.factory.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('FactoryArgumentConfig: ' + err.message),
      stack: err.stack
    })
  }
}
