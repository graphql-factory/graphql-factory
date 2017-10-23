import _ from 'lodash'

export default function InputObjectFieldConfigMapThunk (fields) {
  return () => {
    return _.mapValues(fields, field => {
      return _.assign({}, field, this.makeType(field))
    })
  }
}
