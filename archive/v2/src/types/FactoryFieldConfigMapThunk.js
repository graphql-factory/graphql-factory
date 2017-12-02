import _ from '../utils/index'
import FactoryArgumentConfig from './FactoryArgumentConfig'

export default function FactoryFieldConfigMapThunk (_this, fields, rootType) {
  try {
    const flds = _.omitBy(fields, field => {
      const { omitFrom } = field
      return omitFrom && (_.includes(omitFrom, rootType) || omitFrom === rootType)
    })

    if (!_.keys(flds).length) return

    return () => _.mapValues(flds, field => {
      const f = !_.has(field, 'type') && _.has(field, rootType) ? field[rootType] : field
      const { args, resolve, deprecationReason, description } = field

      return {
        type: _this.resolveType(f, rootType),
        args: _.mapValues(args, arg => FactoryArgumentConfig(_this, arg, rootType)),
        resolve: _this.bindFunction(resolve, f, false),
        deprecationReason,
        description
      }
    })
  } catch (err) {
    _this.factory.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('FactoryFieldConfigMapThunk: ' + err.message),
      stack: err.stack
    })
  }
}
