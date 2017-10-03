import _ from '../utils/index'
import FactoryArgumentConfig from './FactoryArgumentConfig'

export default function FactoryFieldConfigMapThunk (_this, fields, rootType) {
  try {
    fields = _.omitBy(fields, (field) => {
      let { omitFrom } = field
      return omitFrom && (_.includes(omitFrom, rootType) || omitFrom === rootType)
    })

    if (!_.keys(fields).length) return

    return () => _.mapValues(fields, field => {
      field = !_.has(field, 'type') && _.has(field, rootType) ? field[rootType] : field
      let { args, resolve, deprecationReason, description } = field

      return {
        type: _this.resolveType(field, rootType),
        args: _.mapValues(args, (arg) => FactoryArgumentConfig(_this, arg, rootType)),
        resolve: _this.bindFunction(resolve, field),
        deprecationReason,
        description
      }
    })
  } catch (err) {
    console.error('GraphQLFactoryError: FactoryFieldConfigMapThunk', err)
  }
}