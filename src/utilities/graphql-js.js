import {
  getDirectiveValues,
  GraphQLIncludeDirective,
  GraphQLSkipDirective,
} from 'graphql';

/**
 * Ported from graphql-js/execution/execute.js
 * @param {*} info
 * @param {*} node
 */
export function shouldIncludeNode(info, node) {
  const skip = getDirectiveValues(
    GraphQLSkipDirective,
    node,
    info.variableValues,
  );
  if (skip && skip.if === true) {
    return false;
  }

  const include = getDirectiveValues(
    GraphQLIncludeDirective,
    node,
    info.variableValues,
  );
  if (include && include.if === false) {
    return false;
  }
  return true;
}

/**
 * Ported from graphql-js/execution/execute.js
 * @param {*} value
 */
export function getPromise(value) {
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof value.then === 'function'
  ) {
    return value;
  }
}

/**
 * Ported from graphql-js/execution/execute.js
 * @param {*} value
 * @param {*} context
 * @param {*} info
 * @param {*} abstractType
 */
export function defaultResolveTypeFn(value, context, info, abstractType) {
  // First, look for `__typename`.
  if (
    value !== null &&
    typeof value === 'object' &&
    typeof value.__typename === 'string'
  ) {
    return value.__typename;
  }

  // Otherwise, test each possible type.
  const possibleTypes = info.schema.getPossibleTypes(abstractType);
  const promisedIsTypeOfResults = [];

  for (let i = 0; i < possibleTypes.length; i++) {
    const type = possibleTypes[i];

    if (type.isTypeOf) {
      const isTypeOfResult = type.isTypeOf(value, context, info);

      const promise = getPromise(isTypeOfResult);
      if (promise) {
        promisedIsTypeOfResults[i] = promise;
      } else if (isTypeOfResult) {
        return type;
      }
    }
  }

  if (promisedIsTypeOfResults.length) {
    return Promise.all(promisedIsTypeOfResults).then(isTypeOfResults => {
      for (let i = 0; i < isTypeOfResults.length; i++) {
        if (isTypeOfResults[i]) {
          return possibleTypes[i];
        }
      }
    });
  }
}
