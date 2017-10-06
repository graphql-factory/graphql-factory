export default function FactoryInputObjectFieldConfig (_this, field, rootType) {
  try {
    const { defaultValue, description } = field
    const type = _this.resolveType(field, rootType)

    return {
      type,
      defaultValue,
      description
    }
  } catch (err) {
    _this.factory.emit('log', {
      source: 'types',
      level: 'error',
      error: new Error('FactoryInputObjectFieldConfig: ' + err.message),
      stack: err.stack
    })
  }
}
