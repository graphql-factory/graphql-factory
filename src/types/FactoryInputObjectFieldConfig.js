export default function FactoryInputObjectFieldConfig (_this, field, rootType) {
  let { defaultValue, description } = field
  let type = _this.resolveType(field, rootType)

  return {
    type,
    defaultValue,
    description
  }
}