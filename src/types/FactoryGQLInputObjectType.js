import FactoryInputObjectFieldConfigMapThunk from './FactoryInputObjectFieldConfigMapThunk'

export default function FactoryGQLInputObjectType (_this, definition, nameDefault) {
  try {
    let { name, fields, description } = definition

    return new _this.graphql.GraphQLInputObjectType({
      name: name || nameDefault,
      fields: FactoryInputObjectFieldConfigMapThunk(_this, fields, 'Input'),
      description
    })
  } catch (err) {
    console.error('GraphQLFactoryError: FactoryInputObjectFieldConfigMapThunk', err)
  }
}