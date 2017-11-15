/**
 * @flow
 */
import {
  GraphQLScalarType,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  getNamedType
} from 'graphql/type/definition';

import { DirectiveLocation } from 'graphql/type/directives';
import type { DirectiveLocationEnum } from 'graphql/type/directives';
import type { GraphQLType } from 'graphql/type/definition';

// gets the location based on the field type
export default function getFieldTypeLocation(
  type: GraphQLType
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
