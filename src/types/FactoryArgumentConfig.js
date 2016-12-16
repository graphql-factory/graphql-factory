export default function FactoryArgumentConfig (_this, arg = {}, rootType) {
  let { defaultValue, description } = arg
  let type = _this.resolveType(arg, rootType)

  return {
    type,
    defaultValue,
    description
  }
}