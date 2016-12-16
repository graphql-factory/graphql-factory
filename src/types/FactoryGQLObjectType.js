import _ from '../utils/index'
import FactoryInterfacesThunk from './FactoryInterfacesThunk'
import FactoryFieldConfigMapThunk from './FactoryFieldConfigMapThunk'

export default function FactoryGQLObjectType (_this, definition, nameDefault) {
  let { name, interfaces, fields, isTypeOf, description } = definition

  return new _this.graphql.GraphQLObjectType(_.merge({}, definition, {
    name: name || nameDefault,
    interfaces: FactoryInterfacesThunk(_this, interfaces),
    fields: FactoryFieldConfigMapThunk(_this, fields, 'Object'),
    isTypeOf: _this.bindFunction(isTypeOf),
    description
  }))
}