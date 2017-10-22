import _ from 'lodash'

export default function InterfacesThunk (interfaces) {
  try {
    return _.isArray(interfaces) && interfaces.length
      ? () => {
        return _.map(interfaces, i => {
          return _.get(this.types, `["${i}"]`)
        })
      }
      : undefined
  } catch (err) {
    this.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('InterfacesThunk: ' + err.message),
      stack: err.stack
    })
  }
}
