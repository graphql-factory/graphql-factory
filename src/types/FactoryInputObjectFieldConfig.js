export default function FactoryInputObjectFieldConfig (_this, field, rootType) {
  try {
    let { defaultValue, description } = field
    let type = _this.resolveType(field, rootType)

    return {
      type,
      defaultValue,
      description
    }
  } catch (err) {
    console.error('FactoryInputObjectFieldConfig', err)
  }
}