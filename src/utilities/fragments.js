import { lodash as _ } from '../jsutils';
import { typeFromAST, isAbstractType } from 'graphql';

export function getFragment(info, name) {
  return _.get(info, [ 'fragments', name ]);
}

/**
 * Determines if a fragment is applicable to the given type.
 * ported from graphql-js/execution/execute.js
 */
export function doesFragmentConditionMatch(info, fragment, type) {
  const typeConditionNode = fragment.typeCondition;
  if (!typeConditionNode) {
    return true;
  }

  const conditionalType = typeFromAST(info.schema, typeConditionNode);

  if (conditionalType === type) {
    return true;
  }
  if (isAbstractType(conditionalType)) {
    return info.schema.isPossibleType(conditionalType, type);
  }
  return false;
}
