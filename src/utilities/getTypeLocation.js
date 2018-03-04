/**
 * Maps a graphql type to a field type. Strips list and non-nulls first
 *
 * @flow
 */
import { NamedType } from '../definition/const';
import {
  GraphQLScalarType,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  getNamedType,
  DirectiveLocation,
} from 'graphql';

import type { DirectiveLocationEnum, GraphQLType } from 'graphql';

/**
 * Gets the directive location based on the graphql type
 * @param {*} type
 */
export function getFieldTypeLocation(
  type: GraphQLType,
): ?DirectiveLocationEnum {
  const namedType = getNamedType(type);

  if (namedType instanceof GraphQLScalarType) {
    return DirectiveLocation.SCALAR;
  } else if (namedType instanceof GraphQLObjectType) {
    return DirectiveLocation.OBJECT;
  } else if (namedType instanceof GraphQLInterfaceType) {
    return DirectiveLocation.INTERFACE;
  } else if (namedType instanceof GraphQLUnionType) {
    return DirectiveLocation.UNION;
  } else if (namedType instanceof GraphQLEnumType) {
    return DirectiveLocation.ENUM;
  } else if (namedType instanceof GraphQLInputObjectType) {
    return DirectiveLocation.INPUT_OBJECT;
  }
}

/**
 * Gets the directive location based on the factory named type
 * @param {*} type
 */
export function getNamedTypeLocation(type: string) {
  switch (type) {
    case NamedType.ENUM:
      return DirectiveLocation.ENUM;
    case NamedType.OBJECT:
      return DirectiveLocation.OBJECT;
    case NamedType.SCALAR:
      return DirectiveLocation.SCALAR;
    case NamedType.INTERFACE:
      return DirectiveLocation.INTERFACE;
    case NamedType.UNION:
      return DirectiveLocation.UNION;
    case NamedType.INPUT:
      return DirectiveLocation.INPUT_OBJECT;
    default:
      break;
  }
}
