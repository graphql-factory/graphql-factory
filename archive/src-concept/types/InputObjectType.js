import _ from '../common/lodash.custom'
import { GraphQLInputObjectType } from 'graphql'
import InputObjectFieldConfigMapThunk from './InputObjectFieldConfigMapThunk'

export default function InputObjectType (definition) {
  try {
    const def = _.merge({}, definition)
    const { fields } = definition
    def.fields = InputObjectFieldConfigMapThunk.call(this, fields)

    return new GraphQLInputObjectType(def)
  } catch (err) {
    this.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('InputObjectType: ' + err.message),
      stack: err.stack
    })
  }
}
