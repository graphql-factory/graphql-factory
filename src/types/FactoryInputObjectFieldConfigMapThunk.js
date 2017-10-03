import _ from '../utils/index'
import FactoryInputObjectFieldConfig from './FactoryInputObjectFieldConfig'

export default function FactoryInputObjectFieldConfigMapThunk (_this, fields, rootType) {
  try {
    fields = _.omitBy(fields, (field) => {
      let { omitFrom } = field
      return omitFrom && (_.includes(omitFrom, rootType) || omitFrom === rootType)
    })

    if (!_.keys(fields).length) return

    return () => _.mapValues(fields, (field) => FactoryInputObjectFieldConfig(_this, field, rootType))
  } catch (err) {
    console.error('GraphQLFactoryError: FactoryInputObjectFieldConfigMapThunk:', err)
  }
}