import _ from '../utils/index'
import FactoryInterfacesThunk from './FactoryInterfacesThunk'
import FactoryFieldConfigMapThunk from './FactoryFieldConfigMapThunk'

export default function FactoryGQLObjectType (_this, definition, nameDefault) {
  try {
    const { name, interfaces, fields, isTypeOf, description } = definition

    return new _this.graphql.GraphQLObjectType(_.merge({}, definition, {
      name: name || nameDefault,
      interfaces: FactoryInterfacesThunk(_this, interfaces),
      fields: FactoryFieldConfigMapThunk(_this, fields, 'Object'),
      isTypeOf: _this.bindFunction(isTypeOf, definition, true),
      description
    }))
  } catch (err) {
    _this.factory.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('FactoryGQLObjectType: ' + err.message),
      stack: err.stack
    })
  }
}
