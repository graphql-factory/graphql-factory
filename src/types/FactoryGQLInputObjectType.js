import FactoryInputObjectFieldConfigMapThunk from './FactoryInputObjectFieldConfigMapThunk'

export default function FactoryGQLInputObjectType (_this, definition, nameDefault) {
  try {
    const { name, fields, description } = definition

    return new _this.graphql.GraphQLInputObjectType({
      name: name || nameDefault,
      fields: FactoryInputObjectFieldConfigMapThunk(_this, fields, 'Input'),
      description
    })
  } catch (err) {
    _this.factory.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('FactoryGQLInputObjectType: ' + err.message),
      stack: err.stack
    })
  }
}
