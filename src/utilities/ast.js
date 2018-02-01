import { Kind } from 'graphql';

export function isNonNullTypeAST(astNode) {
  return astNode.kind === Kind.NON_NULL_TYPE;
}

export function isListTypeAST(astNode) {
  return astNode.kind === Kind.LIST_TYPE;
}

export function hasListTypeAST(astNode) {
  if (isNonNullTypeAST(astNode)) {
    return hasListTypeAST(astNode.type);
  }
  return isListTypeAST(astNode);
}

export function getBaseTypeAST(astNode) {
  if (isNonNullTypeAST(astNode) || isListTypeAST(astNode)) {
    return getBaseTypeAST(astNode.type);
  }
  return astNode;
}
