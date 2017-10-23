import _ from 'lodash'

export default function FieldConfigMapThunk (fields) {
  try {
    return () => _.mapValues(fields, field => {
      const { args, resolve } = field

      field.type = this.makeType(field)

      if (args) {
        field.args = _.map(args, arg => {
          arg.type = this.makeType(arg)
          return arg
        })
      }
      if (resolve) {
        field.resolve = this.bindResolve(resolve, field)
      }

      return field
    })
  } catch (err) {
    this.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('FieldConfigMapThunk: ' + err.message),
      stack: err.stack
    })
  }
}
