import _ from '../common/lodash.custom'
import InterfacesThunk from './InterfacesThunk'
import FieldConfigMapThunk from './FieldConfigMapThunk'

export default function ObjectType (definition) {
  try {
    const { GraphQLObjectType } = this.graphql
    const def = _.merge({}, definition)
    const { interfaces, fields, isTypeOf } = def

    // update fields with types and functions
    def.interfaces = InterfacesThunk.call(this, interfaces)
    def.fields = FieldConfigMapThunk.call(this, fields)

    if (_.isFunction(isTypeOf) || _.isString(isTypeOf)) {
      def.isTypeOf = this.bindFunction(isTypeOf, definition)
    }

    return new GraphQLObjectType(def)
  } catch (err) {
    this.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('ObjectType: ' + err.message),
      stack: err.stack
    })
  }
}
