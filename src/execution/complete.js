/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found at
 * https://github.com/graphql/graphql-js/blob/master/README.md
 * 
 * Modified for graphql-factory to export complete functions not
 * exported by the graphql-js library
 * 
 * @flow
 */
import type {
  ExecutionContext
} from 'graphql/execution/execute';
import {
  responsePathAsArray,
  addPath,
  collectFields
} from 'graphql/execution/execute';
import type {
  GraphQLType,
  GraphQLLeafType,
  GraphQLAbstractType,
  GraphQLResolveInfo,
  ResponsePath,
} from 'graphql/type/definition';
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  isAbstractType,
  isLeafType
} from 'graphql/type/definition';
import type { FieldNode } from 'graphql/language/ast';
import { GraphQLError, locatedError } from 'graphql/error';
import isNullish from 'graphql/jsutils/isNullish';
import invariant from 'graphql/jsutils/invariant';
import { forEach, isCollection } from 'iterall';
import { getPromise } from '../jsutils/promise';
import { executeFields } from './execute';


// This is a small wrapper around completeValue which detects and logs errors
// in the execution context.
export function completeValueCatchingError(
  exeContext: ExecutionContext,
  returnType: GraphQLType,
  fieldNodes: Array<FieldNode>,
  info: GraphQLResolveInfo,
  path: ResponsePath,
  result: mixed
): mixed {
  // If the field type is non-nullable, then it is resolved without any
  // protection from errors, however it still properly locates the error.
  if (returnType instanceof GraphQLNonNull) {
    return completeValueWithLocatedError(
      exeContext,
      returnType,
      fieldNodes,
      info,
      path,
      result
    );
  }

  // Otherwise, error protection is applied, logging the error and resolving
  // a null value for this field if one is encountered.
  try {
    const completed = completeValueWithLocatedError(
      exeContext,
      returnType,
      fieldNodes,
      info,
      path,
      result
    );
    const promise = getPromise(completed);
    if (promise) {
      // If `completeValueWithLocatedError` returned a rejected promise, log
      // the rejection error and resolve to null.
      // Note: we don't rely on a `catch` method, but we do expect "thenable"
      // to take a second callback for the error case.
      return promise.then(undefined, error => {
        exeContext.errors.push(error);
        return Promise.resolve(null);
      });
    }
    return completed;
  } catch (error) {
    // If `completeValueWithLocatedError` returned abruptly (threw an error),
    // log the error and return null.
    exeContext.errors.push(error);
    return null;
  }
}

// This is a small wrapper around completeValue which annotates errors with
// location information.
function completeValueWithLocatedError(
  exeContext: ExecutionContext,
  returnType: GraphQLType,
  fieldNodes: Array<FieldNode>,
  info: GraphQLResolveInfo,
  path: ResponsePath,
  result: mixed
): mixed {
  try {
    const completed = completeValue(
      exeContext,
      returnType,
      fieldNodes,
      info,
      path,
      result
    );
    const promise = getPromise(completed);
    if (promise) {
      return promise.then(
        undefined,
        error => Promise.reject(
          locatedError(error, fieldNodes, responsePathAsArray(path))
        )
      );
    }
    return completed;
  } catch (error) {
    throw locatedError(error, fieldNodes, responsePathAsArray(path));
  }
}

/**
 * Implements the instructions for completeValue as defined in the
 * "Field entries" section of the spec.
 *
 * If the field type is Non-Null, then this recursively completes the value
 * for the inner type. It throws a field error if that completion returns null,
 * as per the "Nullability" section of the spec.
 *
 * If the field type is a List, then this recursively completes the value
 * for the inner type on each item in the list.
 *
 * If the field type is a Scalar or Enum, ensures the completed value is a legal
 * value of the type by calling the `serialize` method of GraphQL type
 * definition.
 *
 * If the field is an abstract type, determine the runtime type of the value
 * and then complete based on that type
 *
 * Otherwise, the field type expects a sub-selection set, and will complete the
 * value by evaluating all sub-selections.
 */
function completeValue(
  exeContext: ExecutionContext,
  returnType: GraphQLType,
  fieldNodes: Array<FieldNode>,
  info: GraphQLResolveInfo,
  path: ResponsePath,
  result: mixed
): mixed {
  // If result is a Promise, apply-lift over completeValue.
  const promise = getPromise(result);
  if (promise) {
    return promise.then(
      resolved => completeValue(
        exeContext,
        returnType,
        fieldNodes,
        info,
        path,
        resolved
      )
    );
  }

  // If result is an Error, throw a located error.
  if (result instanceof Error) {
    throw result;
  }

  // If field type is NonNull, complete for inner type, and throw field error
  // if result is null.
  if (returnType instanceof GraphQLNonNull) {
    const completed = completeValue(
      exeContext,
      returnType.ofType,
      fieldNodes,
      info,
      path,
      result
    );
    if (completed === null) {
      throw new Error(
        `Cannot return null for non-nullable field ${
          info.parentType.name}.${info.fieldName}.`
      );
    }
    return completed;
  }

  // If result value is null-ish (null, undefined, or NaN) then return null.
  if (isNullish(result)) {
    return null;
  }

  // If field type is List, complete each item in the list with the inner type
  if (returnType instanceof GraphQLList) {
    return completeListValue(
      exeContext,
      returnType,
      fieldNodes,
      info,
      path,
      result
    );
  }

  // If field type is a leaf type, Scalar or Enum, serialize to a valid value,
  // returning null if serialization is not possible.
  if (isLeafType(returnType)) {
    return completeLeafValue(returnType, result);
  }

  // If field type is an abstract type, Interface or Union, determine the
  // runtime Object type and complete for that type.
  if (isAbstractType(returnType)) {
    return completeAbstractValue(
      exeContext,
      returnType,
      fieldNodes,
      info,
      path,
      result
    );
  }

  // If field type is Object, execute and complete all sub-selections.
  if (returnType instanceof GraphQLObjectType) {
    return completeObjectValue(
      exeContext,
      returnType,
      fieldNodes,
      info,
      path,
      result
    );
  }

  // Not reachable. All possible output types have been considered.
  throw new Error(
    `Cannot complete value of unexpected type "${String(returnType)}".`
  );
}

/**
 * Complete a list value by completing each item in the list with the
 * inner type
 */
function completeListValue(
  exeContext: ExecutionContext,
  returnType: GraphQLList<*>,
  fieldNodes: Array<FieldNode>,
  info: GraphQLResolveInfo,
  path: ResponsePath,
  result: mixed
): mixed {
  invariant(
    isCollection(result),
    `Expected Iterable, but did not find one for field ${
      info.parentType.name}.${info.fieldName}.`
  );

  // This is specified as a simple map, however we're optimizing the path
  // where the list contains no Promises by avoiding creating another Promise.
  const itemType = returnType.ofType;
  let containsPromise = false;
  const completedResults = [];
  forEach((result: any), (item, index) => {
    // No need to modify the info object containing the path,
    // since from here on it is not ever accessed by resolver functions.
    const fieldPath = addPath(path, index);
    const completedItem = completeValueCatchingError(
      exeContext,
      itemType,
      fieldNodes,
      info,
      fieldPath,
      item
    );

    if (!containsPromise && getPromise(completedItem)) {
      containsPromise = true;
    }
    completedResults.push(completedItem);
  });

  return containsPromise ? Promise.all(completedResults) : completedResults;
}

/**
 * Complete a Scalar or Enum by serializing to a valid value, returning
 * null if serialization is not possible.
 */
function completeLeafValue(
  returnType: GraphQLLeafType,
  result: mixed
): mixed {
  invariant(returnType.serialize, 'Missing serialize method on type');
  const serializedResult = returnType.serialize(result);
  if (isNullish(serializedResult)) {
    throw new Error(
      `Expected a value of type "${String(returnType)}" but ` +
      `received: ${String(result)}`
    );
  }
  return serializedResult;
}

/**
 * Complete a value of an abstract type by determining the runtime object type
 * of that value, then complete the value for that type.
 */
function completeAbstractValue(
  exeContext: ExecutionContext,
  returnType: GraphQLAbstractType,
  fieldNodes: Array<FieldNode>,
  info: GraphQLResolveInfo,
  path: ResponsePath,
  result: mixed
): mixed {
  const runtimeType = returnType.resolveType ?
    returnType.resolveType(result, exeContext.contextValue, info) :
    defaultResolveTypeFn(result, exeContext.contextValue, info, returnType);

  const promise = getPromise(runtimeType);
  if (promise) {
    return promise.then(resolvedRuntimeType =>
      completeObjectValue(
        exeContext,
        ensureValidRuntimeType(
          resolvedRuntimeType,
          exeContext,
          returnType,
          fieldNodes,
          info,
          result
        ),
        fieldNodes,
        info,
        path,
        result
      )
    );
  }

  return completeObjectValue(
    exeContext,
    ensureValidRuntimeType(
      ((runtimeType: any): ?GraphQLObjectType | string),
      exeContext,
      returnType,
      fieldNodes,
      info,
      result
    ),
    fieldNodes,
    info,
    path,
    result
  );
}

function ensureValidRuntimeType(
  runtimeTypeOrName: ?GraphQLObjectType | string,
  exeContext: ExecutionContext,
  returnType: GraphQLAbstractType,
  fieldNodes: Array<FieldNode>,
  info: GraphQLResolveInfo,
  result: mixed
): GraphQLObjectType {
  const runtimeType = typeof runtimeTypeOrName === 'string' ?
    exeContext.schema.getType(runtimeTypeOrName) :
    runtimeTypeOrName;

  if (!(runtimeType instanceof GraphQLObjectType)) {
    throw new GraphQLError(
      `Abstract type ${returnType.name} must resolve to an Object type at ` +
      `runtime for field ${info.parentType.name}.${info.fieldName} with ` +
      `value "${String(result)}", received "${String(runtimeType)}".`,
      fieldNodes
    );
  }

  if (!exeContext.schema.isPossibleType(returnType, runtimeType)) {
    throw new GraphQLError(
      `Runtime Object type "${runtimeType.name}" is not a possible type ` +
      `for "${returnType.name}".`,
      fieldNodes
    );
  }

  return runtimeType;
}

/**
 * Complete an Object value by executing all sub-selections.
 */
function completeObjectValue(
  exeContext: ExecutionContext,
  returnType: GraphQLObjectType,
  fieldNodes: Array<FieldNode>,
  info: GraphQLResolveInfo,
  path: ResponsePath,
  result: mixed
): mixed {
  // If there is an isTypeOf predicate function, call it with the
  // current result. If isTypeOf returns false, then raise an error rather
  // than continuing execution.
  if (returnType.isTypeOf) {
    const isTypeOf = returnType.isTypeOf(result, exeContext.contextValue, info);

    const promise = getPromise(isTypeOf);
    if (promise) {
      return promise.then(isTypeOfResult => {
        if (!isTypeOfResult) {
          throw invalidReturnTypeError(returnType, result, fieldNodes);
        }
        return collectAndExecuteSubfields(
          exeContext,
          returnType,
          fieldNodes,
          info,
          path,
          result
        );
      });
    }

    if (!isTypeOf) {
      throw invalidReturnTypeError(returnType, result, fieldNodes);
    }
  }

  return collectAndExecuteSubfields(
    exeContext,
    returnType,
    fieldNodes,
    info,
    path,
    result
  );
}

function invalidReturnTypeError(
  returnType: GraphQLObjectType,
  result: mixed,
  fieldNodes: Array<FieldNode>
): GraphQLError {
  return new GraphQLError(
    `Expected value of type "${returnType.name}" but got: ${String(result)}.`,
    fieldNodes
  );
}

function collectAndExecuteSubfields(
  exeContext: ExecutionContext,
  returnType: GraphQLObjectType,
  fieldNodes: Array<FieldNode>,
  info: GraphQLResolveInfo,
  path: ResponsePath,
  result: mixed
): mixed {
  // Collect sub-fields to execute to complete this value.
  let subFieldNodes = Object.create(null);
  const visitedFragmentNames = Object.create(null);
  for (let i = 0; i < fieldNodes.length; i++) {
    const selectionSet = fieldNodes[i].selectionSet;
    if (selectionSet) {
      subFieldNodes = collectFields(
        exeContext,
        returnType,
        selectionSet,
        subFieldNodes,
        visitedFragmentNames
      );
    }
  }

  return executeFields(exeContext, returnType, result, path, subFieldNodes);
}

/**
 * If a resolveType function is not given, then a default resolve behavior is
 * used which tests each possible type for the abstract type by calling
 * isTypeOf for the object being coerced, returning the first type that matches.
 */
function defaultResolveTypeFn(
  value: mixed,
  context: mixed,
  info: GraphQLResolveInfo,
  abstractType: GraphQLAbstractType
): ?GraphQLObjectType | Promise<?GraphQLObjectType> {
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
