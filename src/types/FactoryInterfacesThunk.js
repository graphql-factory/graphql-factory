import _ from '../utils'

export default function FactoryInterfacesThunk (_this, interfaces = []) {
  if (!_.isArray(interfaces) || !interfaces.length) return

  let thunk = _.without(_.map(interfaces, (type) => {
    let iface = _this.resolveType(type)
    if (iface instanceof _this.graphql.GraphQLInterfaceType) return iface
    return null
  }), null)

  return thunk.length > 0 ? () => thunk : undefined
}