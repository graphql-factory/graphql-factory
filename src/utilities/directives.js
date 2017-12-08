import { get, isObject } from '../jsutils';
import { getDirective } from '../middleware/directives';
import { getSelection } from './info';
import {
  Kind,
  DirectiveLocation
} from 'graphql';
import { getOperationRootType } from 'graphql/execution/execute';

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
  [Kind.FIELD_DEFINITION]: DirectiveLocation.FIELD_DEFINITION
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
  if (!isObject(astNode)) {
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
    }, Object.create(null))
  };
}

/**
 * Gets the field directives
 * @param {*} info 
 */
export function getFieldDirectives(info) {
  if (typeof info.parentType.getFields !== 'function') {
    throw new Error('Cannot get field directive on non-field type');
  }
  const selection = getSelection(info);
  const fieldDefAST = get(
    info.parentType.getFields(),
    [ info.fieldName, 'astNode' ]
  );

  return Object.assign(
    Object.create(null),
    getDirectivesFromAST(info, fieldDefAST),
    getDirectivesFromAST(info, selection)
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
    getDirectivesFromAST(info, operation, opLocation)
  );
}
