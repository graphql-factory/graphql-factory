import _ from '../utils/index'
import FactoryInputObjectFieldConfig from './FactoryInputObjectFieldConfig'

export default function FactoryInputObjectFieldConfigMapThunk (_this, fields, rootType) {
  try {
    const f = _.omitBy(fields, field => {
      const { omitFrom } = field
      return omitFrom && (_.includes(omitFrom, rootType) || omitFrom === rootType)
    })

    if (!_.keys(f).length) return

    return () => _.mapValues(f, field => {
      return FactoryInputObjectFieldConfig(_this, field, rootType)
    })
  } catch (err) {
    _this.factory.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('FactoryInputObjectFieldConfigMapThunk: ' + err.message),
      stack: err.stack
    })
  }
}
