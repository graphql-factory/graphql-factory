import _ from '../utils/index'

export default function FactoryInterfacesThunk (_this, interfaces = []) {
  try {
    if (!_.isArray(interfaces) || !interfaces.length) return

    const thunk = _.without(_.map(interfaces, type => {
      const iface = _this.resolveType(type)
      if (iface instanceof _this.graphql.GraphQLInterfaceType) return iface
      return null
    }), null)

    return thunk.length > 0 ? () => thunk : undefined
  } catch (err) {
    _this.factory.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('FactoryInterfacesThunk: ' + err.message),
      stack: err.stack
    })
  }
}
