export default function FactoryArgumentConfig (_this, arg = {}, rootType) {
  try {
    let { defaultValue, description } = arg
    let type = _this.resolveType(arg, rootType)

    return {
      type,
      defaultValue,
      description
    }
  } catch (err) {
    console.error('FactoryArgumentConfig', err)
  }
}