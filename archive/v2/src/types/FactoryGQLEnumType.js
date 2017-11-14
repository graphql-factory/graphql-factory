import FactoryEnumValueConfigMap from './FactoryEnumValueConfigMap'

export default function FactoryGQLEnumType (_this, definition, nameDefault) {
  try {
    const { name, values, description } = definition

    return new _this.graphql.GraphQLEnumType({
      name: name || nameDefault,
      values: FactoryEnumValueConfigMap(_this, values),
      description
    })
  } catch (err) {
    _this.factory.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('FactoryGQLEnumType: ' + err.message),
      stack: err.stack
    })
  }
}
