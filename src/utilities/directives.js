import { lodash as _ } from '../jsutils';
import { getDirective } from '../execution/directives';
import { getSelection } from './info';
import {
  Kind,
  GraphQLScalarType,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  getNamedType,
  DirectiveLocation,
} from 'graphql';
import { getOperationRootType } from 'graphql/execution/execute';
import { NamedType } from '../definition/const';
import type { DirectiveLocationEnum, GraphQLType } from 'graphql';

export const DirectiveLocationMap = {
  // operational
  [Kind.FIELD]: DirectiveLocation.FIELD,
  [Kind.FRAGMENT_SPREAD]: DirectiveLocation.FRAGMENT_SPREAD,
  [Kind.FRAGMENT_DEFINITION]: DirectiveLocation.FRAGMENT_DEFINITION,
  [Kind.INLINE_FRAGMENT]: DirectiveLocation.INLINE_FRAGMENT,

  // definition
  [Kind.SCHEMA_DEFINITION]: DirectiveLocation.SCHEMA,
  [Kind.OBJECT_TYPE_DEFINITION]: DirectiveLocation.OBJECT,
  [Kind.SCALAR_TYPE_DEFINITION]: DirectiveLocation.SCALAR,
  [Kind.INTERFACE_TYPE_DEFINITION]: DirectiveLocation.INTERFACE,
  [Kind.UNION_TYPE_DEFINITION]: DirectiveLocation.UNION,
  [Kind.ENUM_TYPE_DEFINITION]: DirectiveLocation.ENUM,
  [Kind.FIELD_DEFINITION]: DirectiveLocation.FIELD_DEFINITION,
};

export function getOperationLocation(info) {
  switch (info.operation.operation) {
    case 'query':
      return DirectiveLocation.QUERY;
    case 'mutation':
      return DirectiveLocation.MUTATION;
    case 'subscription':
      return DirectiveLocation.SUBSCRIPTION;
    default:
      return null;
  }
}

/**
 * Extracts directives and their argument values from
 * and astNode
 * @param {*} info
 * @param {*} astNode
 */
export function getDirectivesFromAST(info, astNode, locationOverride) {
  if (!_.isObjectLike(astNode)) {
    return Object.create(null);
  }
  const { kind, directives } = astNode;
  const location = locationOverride || DirectiveLocationMap[kind];
  return {
    [location]: directives.reduce((loc, ast) => {
      const { name: { value: name } } = ast;
      const dirInfo = getDirective(info, name, astNode);
      if (dirInfo) {
        loc[name] = dirInfo.args;
      }
      return loc;
    }, Object.create(null)),
  };
}

/**
 * Gets the field directives
 * @param {*} info
 */
export function getFieldDirectives(info) {
  const nfo = info.fieldInfo || info;
  if (typeof nfo.parentType.getFields !== 'function') {
    throw new Error('Cannot get field directive on non-field type');
  }
  const selection = getSelection(info);
  const fieldDefAST = _.get(nfo.parentType.getFields(), [
    nfo.fieldName,
    'astNode',
  ]);

  return Object.assign(
    Object.create(null),
    getDirectivesFromAST(info, fieldDefAST),
    getDirectivesFromAST(info, selection),
  );
}

/**
 * Gets the schema definition directives
 * @param {*} info
 */
export function getSchemaDirectives(info) {
  return getDirectivesFromAST(info, info.schema.astNode);
}

/**
 * Gets operation directives
 * @param {*} info
 */
export function getOperationDirectives(info) {
  const { schema, operation } = info;
  const opLocation = DirectiveLocation[operation.operation.toUpperCase()];
  const rootType = getOperationRootType(schema, operation);

  return Object.assign(
    Object.create(null),
    getDirectivesFromAST(info, rootType.astNode),
    getDirectivesFromAST(info, operation, opLocation),
  );
}

/**
 * Converts an object-like directive attach definition into an array
 * @param {*} directives
 */
export function castAppliedDirectiveList(directives) {
  return _.isArray(directives)
    ? directives
    : _.isObject(directives)
      ? _.map(directives, (args, name) => {
          return { name, args };
        })
      : [];
}

/**
 * Finds the first directive with the specficied name
 * @param {*} directives
 * @param {*} name
 */
export function findAppliedDirective(obj, name) {
  const directives = _.get(obj, ['@directives']) || obj;
  const dirs = castAppliedDirectiveList(directives);
  return _.find(dirs, { name });
}

/**
 * filters the applied directives
 * @param {*} directives
 * @param {*} filter
 */
export function filterAppliedDirectives(obj, filter) {
  const directives = _.get(obj, ['@directives']) || obj;
  const dirs = castAppliedDirectiveList(directives);
  return _.filter(dirs, filter);
}

/**
 * Gets a directive argument value by name
 * @param {*} obj
 * @param {*} name
 * @param {*} argName
 */
export function getDirectiveArgValue(obj, name, argName) {
  const directive = findAppliedDirective(obj, name);
  return _.get(directive, ['args', argName]);
}

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
