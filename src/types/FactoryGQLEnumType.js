import FactoryEnumValueConfigMap from './FactoryEnumValueConfigMap'

export default function FactoryGQLEnumType (_this, definition, nameDefault) {
  try {
    let { name, values, description } = definition

    return new _this.graphql.GraphQLEnumType({
      name: name || nameDefault,
      values: FactoryEnumValueConfigMap(_this, values),
      description
    })
  } catch (err) {
    console.error('GraphQLFactoryError: FactoryGQLEnumType', err)
  }
}