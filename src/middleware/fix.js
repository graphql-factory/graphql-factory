import { isSpecifiedScalarType } from 'graphql';
import { forEach } from '../jsutils';
import { getGraphQLTypeName } from '../utilities';

export function fixRenamed(schema) {
  const renamed = {};
  const typeMap = Object.create(null);

  // first get all types that need to be renamed
  forEach(schema.getTypeMap(), (type, name) => {
    if (name.startsWith('__')) {
      typeMap[name] = type;
      return;
    } else if (type.name !== name) {
      renamed[name] = type.name;
    }
    typeMap[type.name] = type;
  });

  // now fix each type
  forEach(typeMap, type => {
    if (!type.name.startsWith('__') && !isSpecifiedScalarType(type)) {
      switch (getGraphQLTypeName(type, true)) {
        case 'GraphQLScalarType':
        case 'GraphQLObjectType':
        case 'GraphQLInterfaceType':
        case 'GraphQLUnionType':
        case 'GraphQLEnumType':
        case 'GraphQLInputObjectType':
        default:
          break;
      }
    }
  });

  return schema;
}
