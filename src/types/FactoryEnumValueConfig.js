import _ from '../utils/index'

export default function FactoryEnumValueConfig (_this, val) {
  try {
    const { value, deprecationReason, description } = _.isObject(val)
      ? val
      : { value: val }

    return {
      value,
      deprecationReason,
      description
    }
  } catch (err) {
    _this.factory.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('FactoryEnumValueConfig: ' + err.message),
      stack: err.stack
    })
  }
}
