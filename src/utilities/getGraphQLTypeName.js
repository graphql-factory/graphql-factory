import {
  isScalarType,
  isObjectType,
  isInterfaceType,
  isUnionType,
  isEnumType,
  isInputObjectType,
  GraphQLError,
} from 'graphql';

export function getGraphQLTypeName(type, ignoreInvalid) {
  if (isScalarType(type)) {
    return 'GraphQLScalarType';
  } else if (isObjectType(type)) {
    return 'GraphQLObjectType';
  } else if (isInterfaceType(type)) {
    return 'GraphQLInterfaceType';
  } else if (isUnionType(type)) {
    return 'GraphQLUnionType';
  } else if (isEnumType(type)) {
    return 'GraphQLEnumType';
  } else if (isInputObjectType(type)) {
    return 'GraphQLInputObjectType';
  }

  if (!ignoreInvalid) {
    throw new GraphQLError('Unable to determine GraphQL type for ' + type);
  }
}
