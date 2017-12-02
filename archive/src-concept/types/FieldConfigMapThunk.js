import _ from '../common/lodash.custom'

export default function FieldConfigMapThunk (fields) {
  return () => _.mapValues(fields, field => {
    try {
      const { args, resolve } = field

      field.type = this.makeType(field)

      if (args) {
        field.args = _.mapValues(args, arg => {
          arg.type = this.makeType(arg)
          return arg
        })
      }
      if (resolve) {
        field.resolve = this.bindResolve(resolve, field)
      }

      return field
    } catch (err) {
      this.emit('log', {
        source: 'types',
        level: 'error',
        error: new Error('FieldConfigMapThunk: ' + err.message),
        stack: err.stack
      })
    }
  })
}
