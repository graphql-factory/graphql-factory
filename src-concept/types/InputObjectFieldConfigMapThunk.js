import _ from '../common/lodash.custom'

export default function InputObjectFieldConfigMapThunk (fields) {
  return () => {
    return _.mapValues(fields, field => {
      return _.assign({}, field, this.makeType(field))
    })
  }
}
