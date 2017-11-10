import { Kind } from 'graphql'

/**
 * parses ast nodes into an object
 * doesn't work for everything!!!
 * @param nodes
 */
export function parseAST (nodes) {
  if (Array.isArray(nodes)) {
    return nodes.reduce((obj, node) => {
      const { kind, name, value, arguments: args } = node

      switch (kind) {
        case Kind.DIRECTIVE:
          obj[name.value] = !Array.isArray(args) || !args.length
            ? true
            : parseAST(args)
          break

        default:
          obj[name.value] = value.kind === Kind.LIST
            ? value.values.map(parseAST)
            : parseAST(value)
          break
      }

      return obj
    }, {})
  } else if (typeof nodes === 'object' && nodes !== null) {
    const { kind, value, fields } = nodes

    switch (kind) {
      case Kind.INT:
      case Kind.FLOAT:
      case Kind.STRING:
      case Kind.BOOLEAN:
      case Kind.NULL:
        return value

      case Kind.OBJECT:
        return parseAST(fields)

      default:
        break
    }
  }
}

/**
 * Gets the inner type name
 * @param kind
 * @param type
 */
export function baseName ({ kind, type, name }) {
  switch (kind) {
    case Kind.LIST_TYPE:
    case Kind.NON_NULL_TYPE:
      return baseName(type)
    default:
      return name.value
  }
}
