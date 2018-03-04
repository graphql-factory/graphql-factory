/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */
import { forEach, isCollection } from 'iterall';
import {
  isObjectType,
  isAbstractType,
  isLeafType,
  isListType,
  isNonNullType,
  GraphQLError,
  typeFromAST,
  Kind,
  getDirectiveValues,
  GraphQLIncludeDirective,
  GraphQLSkipDirective,
  GraphQLSchema,
  assertValidSchema,
  SchemaMetaFieldDef,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
  DirectiveLocation,
} from 'graphql';
import { locatedError } from 'graphql/error';
import invariant from 'graphql/jsutils/invariant';
import isInvalid from 'graphql/jsutils/isInvalid';
import isNullish from 'graphql/jsutils/isNullish';
import memoize3 from 'graphql/jsutils/memoize3';
import promiseForObject from 'graphql/jsutils/promiseForObject';
import promiseReduce from 'graphql/jsutils/promiseReduce';
import { getVariableValues, getArgumentValues } from 'graphql/execution/values';

import type {
  GraphQLList,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLLeafType,
  GraphQLAbstractType,
  GraphQLField,
  GraphQLFieldResolver,
  GraphQLResolveInfo,
  ResponsePath,
  DocumentNode,
  OperationDefinitionNode,
  SelectionSetNode,
  FieldNode,
  FragmentSpreadNode,
  InlineFragmentNode,
  FragmentDefinitionNode,
} from 'graphql';
import type { ObjMap } from 'graphql/jsutils/ObjMap';
import type { MaybePromise } from 'graphql/jsutils/MaybePromise';

import isPromise from '../jsutils/isPromise';

import { lodash as _, getTime } from '../jsutils';
import { getDirectiveContext } from './directives';
import { getOperationLocation, pathToArray } from '../utilities';
import { completeTrace } from './instrumentation';

/**
 * Terminology
 *
 * "Definitions" are the generic name for top-level statements in the document.
 * Examples of this include:
 * 1) Operations (such as a query)
 * 2) Fragments
 *
 * "Operations" are a generic name for requests in the document.
 * Examples of this include:
 * 1) query,
 * 2) mutation
 *
 * "Selections" are the definitions that can appear legally and at
 * single level of the query. These include:
 * 1) field references e.g "a"
 * 2) fragment "spreads" e.g. "...c"
 * 3) inline fragment "spreads" e.g. "...on Type { a }"
 */

/**
 * Data that must be available at all points during query execution.
 *
 * Namely, schema of the type system that is currently executing,
 * and the fragments defined in the query document
 */
export type ExecutionContext = {
  schema: GraphQLSchema,
  fragments: ObjMap<FragmentDefinitionNode>,
  rootValue: mixed,
  contextValue: mixed,
  operation: OperationDefinitionNode,
  variableValues: { [variable: string]: mixed },
  fieldResolver: GraphQLFieldResolver<any, any>,
  errors: Array<GraphQLError>,
};

/**
 * The result of GraphQL execution.
 *
 *   - `errors` is included when any errors occurred as a non-empty array.
 *   - `data` is the result of a successful execution of the query.
 */
export type ExecutionResult = {
  errors?: $ReadOnlyArray<GraphQLError>,
  data?: ObjMap<mixed>,
};

export type ExecutionArgs = {|
  schema: GraphQLSchema,
  document: DocumentNode,
  rootValue?: mixed,
  contextValue?: mixed,
  variableValues?: ?{ [variable: string]: mixed },
  operationName?: ?string,
  fieldResolver?: ?GraphQLFieldResolver<any, any>,
  tracing?: ?ObjMap<any>,
|};

/**
 * Implements the "Evaluating requests" section of the GraphQL specification.
 *
 * Returns either a synchronous ExecutionResult (if all encountered resolvers
 * are synchronous), or a Promise of an ExecutionResult that will eventually be
 * resolved and never rejected.
 *
 * If the arguments to this function do not result in a legal execution context,
 * a GraphQLError will be thrown immediately explaining the invalid input.
 *
 * Accepts either an object with named arguments, or individual arguments.
 */
declare function execute(
  ExecutionArgs,
  ..._: []
): MaybePromise<ExecutionResult>;
/* eslint-disable no-redeclare */
declare function execute(
  schema: GraphQLSchema,
  document: DocumentNode,
  rootValue?: mixed,
  contextValue?: mixed,
  variableValues?: ?{ [variable: string]: mixed },
  operationName?: ?string,
  fieldResolver?: ?GraphQLFieldResolver<any, any>,
  tracing?: ObjMap<any>,
): MaybePromise<ExecutionResult>;
export function execute(
  argsOrSchema,
  document,
  rootValue,
  contextValue,
  variableValues,
  operationName,
  fieldResolver,
  tracing,
) {
  /* eslint-enable no-redeclare */
  // Extract arguments from object args if provided.
  return arguments.length === 1
    ? executeImpl(
        argsOrSchema.schema,
        argsOrSchema.document,
        argsOrSchema.rootValue,
        argsOrSchema.contextValue,
        argsOrSchema.variableValues,
        argsOrSchema.operationName,
        argsOrSchema.fieldResolver,
        argsOrSchema.tracing,
      )
    : executeImpl(
        argsOrSchema,
        document,
        rootValue,
        contextValue,
        variableValues,
        operationName,
        fieldResolver,
        tracing,
      );
}

function executeImpl(
  schema,
  document,
  rootValue,
  contextValue,
  variableValues,
  operationName,
  fieldResolver,
  tracing,
) {
  // setup the tracingExtensions
  const tracingExtension = _.isObject(tracing) ? tracing : {};
  _.set(tracingExtension, 'execution.resolvers', []);

  // If arguments are missing or incorrect, throw an error.
  assertValidExecutionArguments(schema, document, variableValues);

  // If a valid context cannot be created due to incorrect arguments,
  // a "Response" with only errors is returned.
  const context = buildExecutionContext(
    schema,
    document,
    rootValue,
    contextValue,
    variableValues,
    operationName,
    fieldResolver,
  );

  // Return early errors if execution context failed.
  if (Array.isArray(context)) {
    return { errors: context };
  }

  // Return a Promise that will eventually resolve to the data described by
  // The "Response" section of the GraphQL specification.
  //
  // If errors are encountered while executing a GraphQL field, only that
  // field and its descendants will be omitted, and sibling fields will still
  // be executed. An execution which encounters errors will still result in a
  // resolved Promise.

  // @FACTORY - Inject schema and operation directive resolvers
  const directiveLocations = [
    {
      location: DirectiveLocation.SCHEMA,
      astNode: schema.astNode,
    },
    {
      location: getOperationLocation(context),
      astNode: context.operation,
    },
  ];
  // add any fragment definitions as well
  _.forEach(context.fragments, fragmentAST => {
    directiveLocations.push({
      location: DirectiveLocation.FRAGMENT_DEFINITION,
      astNode: fragmentAST,
    });
  });
  const { resolveBefore, resolveAfter } = getDirectiveContext(
    context,
    directiveLocations,
  );

  const performOperation = () => {
    const data = executeOperation(
      context,
      context.operation,
      rootValue,
      tracingExtension,
    );
    return buildResponse(context, data, tracing);
  };

  // if no directive resolvers, perform the operation
  if (!resolveBefore.length && !resolveAfter.length) {
    return performOperation();
  }

  // otherwise, process the directive resolvers
  return Promise.resolve()
    .then(() => {
      if (resolveBefore.length) {
        return promiseReduce(resolveBefore, (accum, dirInfo) => {
          const { resolve, args, info } = dirInfo;
          return resolve(undefined, args, contextValue, info);
        });
      }
    })
    .then(() => {
      return performOperation();
    })
    .then(response => {
      if (resolveAfter.length) {
        return promiseReduce(
          resolveAfter,
          (res, dirInfo) => {
            const { resolve, args, info } = dirInfo;
            return resolve(res, args, contextValue, info).then(
              directiveResult => {
                return _.isObject(directiveResult)
                  ? directiveResult
                  : _.isObject(res) ? res : response;
              },
            );
          },
          response,
        );
      }
      return response;
    });
}

/**
 * Given a completed execution context and data, build the { errors, data }
 * response defined by the "Response" section of the GraphQL specification.
 */
function buildResponse(
  context: ExecutionContext,
  data: MaybePromise<ObjMap<mixed> | null>,
  tracing: ObjMap<any>,
) {
  if (isPromise(data)) {
    return data.then(resolved => {
      return buildResponse(context, resolved, tracing);
    });
  }
  completeTrace(tracing);
  return context.errors.length === 0
    ? { data }
    : { errors: context.errors, data };
}

/**
 * Given a ResponsePath (found in the `path` entry in the information provided
 * as the last argument to a field resolver), return an Array of the path keys.
 */
export function responsePathAsArray(
  path: ResponsePath,
): $ReadOnlyArray<string | number> {
  const flattened = [];
  let curr = path;
  while (curr) {
    flattened.push(curr.key);
    curr = curr.prev;
  }
  return flattened.reverse();
}

/**
 * Given a ResponsePath and a key, return a new ResponsePath containing the
 * new key.
 */
export function addPath(prev: ResponsePath | void, key: string | number) {
  return { prev, key };
}

/**
 * Essential assertions before executing to provide developer feedback for
 * improper use of the GraphQL library.
 */
export function assertValidExecutionArguments(
  schema: GraphQLSchema,
  document: DocumentNode,
  rawVariableValues: ?ObjMap<mixed>,
): void {
  invariant(document, 'Must provide document');

  // If the schema used for execution is invalid, throw an error.
  assertValidSchema(schema);

  // Variables, if provided, must be an object.
  invariant(
    !rawVariableValues || typeof rawVariableValues === 'object',
    'Variables must be provided as an Object where each property is a ' +
      'variable value. Perhaps look to see if an unparsed JSON string ' +
      'was provided.',
  );
}

/**
 * Constructs a ExecutionContext object from the arguments passed to
 * execute, which we will pass throughout the other execution methods.
 *
 * Throws a GraphQLError if a valid execution context cannot be created.
 */
export function buildExecutionContext(
  schema: GraphQLSchema,
  document: DocumentNode,
  rootValue: mixed,
  contextValue: mixed,
  rawVariableValues: ?ObjMap<mixed>,
  operationName: ?string,
  fieldResolver: ?GraphQLFieldResolver<any, any>,
): $ReadOnlyArray<GraphQLError> | ExecutionContext {
  const errors: Array<GraphQLError> = [];
  let operation: OperationDefinitionNode | void;
  let hasMultipleAssumedOperations = false;
  const fragments: ObjMap<FragmentDefinitionNode> = Object.create(null);
  for (let i = 0; i < document.definitions.length; i++) {
    const definition = document.definitions[i];
    switch (definition.kind) {
      case Kind.OPERATION_DEFINITION:
        if (!operationName && operation) {
          hasMultipleAssumedOperations = true;
        } else if (
          !operationName ||
          (definition.name && definition.name.value === operationName)
        ) {
          operation = definition;
        }
        break;
      case Kind.FRAGMENT_DEFINITION:
        fragments[definition.name.value] = definition;
        break;
    }
  }

  if (!operation) {
    if (operationName) {
      errors.push(
        new GraphQLError(`Unknown operation named "${operationName}".`),
      );
    } else {
      errors.push(new GraphQLError('Must provide an operation.'));
    }
  } else if (hasMultipleAssumedOperations) {
    errors.push(
      new GraphQLError(
        'Must provide operation name if query contains ' +
          'multiple operations.',
      ),
    );
  }

  let variableValues;
  if (operation) {
    const coercedVariableValues = getVariableValues(
      schema,
      operation.variableDefinitions || [],
      rawVariableValues || {},
    );

    if (coercedVariableValues.errors) {
      errors.push(...coercedVariableValues.errors);
    } else {
      variableValues = coercedVariableValues.coerced;
    }
  }

  if (errors.length !== 0) {
    return errors;
  }

  invariant(operation, 'Has operation if no errors.');
  invariant(variableValues, 'Has variables if no errors.');

  return {
    schema,
    fragments,
    rootValue,
    contextValue,
    operation,
    variableValues,
    fieldResolver: fieldResolver || defaultFieldResolver,
    errors,
  };
}

/**
 * Implements the "Evaluating operations" section of the spec.
 */
function executeOperation(
  exeContext: ExecutionContext,
  operation: OperationDefinitionNode,
  rootValue: mixed,
  tracing: ObjMap<any>,
): MaybePromise<ObjMap<mixed> | null> {
  const type = getOperationRootType(exeContext.schema, operation);
  const { fields, fragments } = collectFields(
    exeContext,
    type,
    operation.selectionSet,
    Object.create(null),
    Object.create(null),
  );
  _.noop(fragments); // TODO: resolve fragment mw
  const path = undefined;

  // Errors from sub-fields of a NonNull type may propagate to the top level,
  // at which point we still log the error and null the parent field, which
  // in this case is the entire response.
  //
  // Similar to completeValueCatchingError.
  try {
    const result =
      operation.operation === 'mutation'
        ? executeFieldsSerially(
            exeContext,
            type,
            rootValue,
            path,
            fields,
            tracing,
          )
        : executeFields(exeContext, type, rootValue, path, fields, tracing);
    if (isPromise(result)) {
      return result.then(undefined, error => {
        exeContext.errors.push(error);
        return Promise.resolve(null);
      });
    }
    return result;
  } catch (error) {
    exeContext.errors.push(error);
    return null;
  }
}

/**
 * Extracts the root type of the operation from the schema.
 */
export function getOperationRootType(
  schema: GraphQLSchema,
  operation: OperationDefinitionNode,
): GraphQLObjectType {
  switch (operation.operation) {
    case 'query':
      const queryType = schema.getQueryType();
      if (!queryType) {
        throw new GraphQLError(
          'Schema does not define the required query root type.',
          [operation],
        );
      }
      return queryType;
    case 'mutation':
      const mutationType = schema.getMutationType();
      if (!mutationType) {
        throw new GraphQLError('Schema is not configured for mutations.', [
          operation,
        ]);
      }
      return mutationType;
    case 'subscription':
      const subscriptionType = schema.getSubscriptionType();
      if (!subscriptionType) {
        throw new GraphQLError('Schema is not configured for subscriptions.', [
          operation,
        ]);
      }
      return subscriptionType;
    default:
      throw new GraphQLError(
        'Can only execute queries, mutations and subscriptions.',
        [operation],
      );
  }
}

/**
 * Implements the "Evaluating selection sets" section of the spec
 * for "write" mode.
 */
function executeFieldsSerially(
  exeContext: ExecutionContext,
  parentType: GraphQLObjectType,
  sourceValue: mixed,
  path: ResponsePath | void,
  fields: ObjMap<Array<FieldNode>>,
  tracing: ObjMap<any>,
): MaybePromise<ObjMap<mixed>> {
  return promiseReduce(
    Object.keys(fields),
    (results, responseName) => {
      const fieldNodes = fields[responseName];
      const fieldPath = addPath(path, responseName);
      const result = resolveField(
        exeContext,
        parentType,
        sourceValue,
        fieldNodes,
        fieldPath,
        tracing,
      );
      if (result === undefined) {
        return results;
      }
      if (isPromise(result)) {
        return result.then(resolvedResult => {
          results[responseName] = resolvedResult;
          return results;
        });
      }
      results[responseName] = result;
      return results;
    },
    Object.create(null),
  );
}

/**
 * Implements the "Evaluating selection sets" section of the spec
 * for "read" mode.
 */
function executeFields(
  exeContext: ExecutionContext,
  parentType: GraphQLObjectType,
  sourceValue: mixed,
  path: ResponsePath | void,
  fields: ObjMap<Array<FieldNode>>,
  tracing: ObjMap<any>,
): MaybePromise<ObjMap<mixed>> {
  let containsPromise = false;

  const finalResults = Object.keys(fields).reduce((results, responseName) => {
    const fieldNodes = fields[responseName];
    const fieldPath = addPath(path, responseName);
    const result = resolveField(
      exeContext,
      parentType,
      sourceValue,
      fieldNodes,
      fieldPath,
      tracing,
    );
    if (result === undefined) {
      return results;
    }
    results[responseName] = result;
    if (!containsPromise && isPromise(result)) {
      containsPromise = true;
    }
    return results;
  }, Object.create(null));

  // If there are no promises, we can just return the object
  if (!containsPromise) {
    return finalResults;
  }

  // Otherwise, results is a map from field name to the result
  // of resolving that field, which is possibly a promise. Return
  // a promise that will return this same map, but with any
  // promises replaced with the values they resolved to.
  return promiseForObject(finalResults);
}
export type CollectedFieldInfo = {
  fields: ObjMap<Array<FieldNode>>,
  fragments: ObjMap<FragmentDefinitionNode>,
};
/**
 * Given a selectionSet, adds all of the fields in that selection to
 * the passed in map of fields, and returns it at the end.
 *
 * CollectFields requires the "runtime type" of an object. For a field which
 * returns an Interface or Union type, the "runtime type" will be the actual
 * Object type returned by that field.
 */
export function collectFields(
  exeContext: ExecutionContext,
  runtimeType: GraphQLObjectType,
  selectionSet: SelectionSetNode,
  fields: ObjMap<Array<FieldNode>>,
  fragments: ObjMap<FragmentDefinitionNode>,
): CollectedFieldInfo {
  for (let i = 0; i < selectionSet.selections.length; i++) {
    const selection = selectionSet.selections[i];
    switch (selection.kind) {
      case Kind.FIELD:
        if (!shouldIncludeNode(exeContext, selection)) {
          continue;
        }
        const name = getFieldEntryKey(selection);
        if (!fields[name]) {
          fields[name] = [];
        }
        fields[name].push(selection);
        break;
      case Kind.INLINE_FRAGMENT:
        if (
          !shouldIncludeNode(exeContext, selection) ||
          !doesFragmentConditionMatch(exeContext, selection, runtimeType)
        ) {
          continue;
        }
        collectFields(
          exeContext,
          runtimeType,
          selection.selectionSet,
          fields,
          fragments,
        );
        break;
      case Kind.FRAGMENT_SPREAD:
        const fragName = selection.name.value;
        if (fragments[fragName] || !shouldIncludeNode(exeContext, selection)) {
          continue;
        }
        const fragment = exeContext.fragments[fragName];
        fragments[fragName] = fragment;
        if (
          !fragment ||
          !doesFragmentConditionMatch(exeContext, fragment, runtimeType)
        ) {
          continue;
        }
        collectFields(
          exeContext,
          runtimeType,
          fragment.selectionSet,
          fields,
          fragments,
        );
        break;
    }
  }
  return { fields, fragments };
}

/**
 * Determines if a field should be included based on the @include and @skip
 * directives, where @skip has higher precidence than @include.
 */
function shouldIncludeNode(
  exeContext: ExecutionContext,
  node: FragmentSpreadNode | FieldNode | InlineFragmentNode,
): boolean {
  const skip = getDirectiveValues(
    GraphQLSkipDirective,
    node,
    exeContext.variableValues,
  );
  if (skip && skip.if === true) {
    return false;
  }

  const include = getDirectiveValues(
    GraphQLIncludeDirective,
    node,
    exeContext.variableValues,
  );
  if (include && include.if === false) {
    return false;
  }
  return true;
}

/**
 * Determines if a fragment is applicable to the given type.
 */
function doesFragmentConditionMatch(
  exeContext: ExecutionContext,
  fragment: FragmentDefinitionNode | InlineFragmentNode,
  type: GraphQLObjectType,
): boolean {
  const typeConditionNode = fragment.typeCondition;
  if (!typeConditionNode) {
    return true;
  }
  const conditionalType = typeFromAST(exeContext.schema, typeConditionNode);
  if (conditionalType === type) {
    return true;
  }
  if (isAbstractType(conditionalType)) {
    return exeContext.schema.isPossibleType(conditionalType, type);
  }
  return false;
}

/**
 * Implements the logic to compute the key of a given field's entry
 */
function getFieldEntryKey(node: FieldNode): string {
  return node.alias ? node.alias.value : node.name.value;
}

/**
 * Resolves the field on the given source object. In particular, this
 * figures out the value that the field returns by calling its resolve function,
 * then calls completeValue to complete promises, serialize scalars, or execute
 * the sub-selection-set for objects.
 */
function resolveField(
  exeContext: ExecutionContext,
  parentType: GraphQLObjectType,
  source: mixed,
  fieldNodes: $ReadOnlyArray<FieldNode>,
  path: ResponsePath,
  tracing: ObjMap<any>,
): MaybePromise<mixed> {
  const fieldNode = fieldNodes[0];
  const fieldName = fieldNode.name.value;

  const fieldDef = getFieldDef(exeContext.schema, parentType, fieldName);
  if (!fieldDef) {
    return;
  }

  const resolveFn = fieldDef.resolve || exeContext.fieldResolver;

  const info = buildResolveInfo(
    exeContext,
    fieldDef,
    fieldNodes,
    parentType,
    path,
  );

  // start a field trace
  const fieldTrace = {
    type: 'FIELD',
    resolver: resolveFn.name,
    path: pathToArray(path),
    location: null,
    parentType: String(parentType),
    fieldName,
    returnType: String(fieldDef.type),
    start: getTime(),
    end: -1,
    duration: -1,
    error: null,
  };

  // add the field trace to the resolvers
  tracing.execution.resolvers.push(fieldTrace);

  // Get the resolve function, regardless of if its result is normal
  // or abrupt (error).
  const result = resolveFieldValueOrError(
    exeContext,
    fieldDef,
    fieldNodes,
    resolveFn,
    source,
    info,
    tracing,
  );

  return completeValueCatchingError(
    exeContext,
    fieldDef.type,
    fieldNodes,
    info,
    path,
    result,
    tracing,
    fieldTrace,
  );
}

export function buildResolveInfo(
  exeContext: ExecutionContext,
  fieldDef: GraphQLField<*, *>,
  fieldNodes: $ReadOnlyArray<FieldNode>,
  parentType: GraphQLObjectType,
  path: ResponsePath,
): GraphQLResolveInfo {
  // The resolve function's optional fourth argument is a collection of
  // information about the current execution state.
  return {
    fieldName: fieldNodes[0].name.value,
    fieldNodes,
    returnType: fieldDef.type,
    parentType,
    path,
    schema: exeContext.schema,
    fragments: exeContext.fragments,
    rootValue: exeContext.rootValue,
    operation: exeContext.operation,
    variableValues: exeContext.variableValues,
  };
}

// Isolates the "ReturnOrAbrupt" behavior to not de-opt the `resolveField`
// function. Returns the result of resolveFn or the abrupt-return Error object.
export function resolveFieldValueOrError<TSource>(
  exeContext: ExecutionContext,
  fieldDef: GraphQLField<TSource, *>,
  fieldNodes: $ReadOnlyArray<FieldNode>,
  resolveFn: GraphQLFieldResolver<TSource, *>,
  source: TSource,
  info: GraphQLResolveInfo,
  tracing: ObjMap<any>,
): Error | mixed {
  try {
    // Build a JS object of arguments from the field.arguments AST, using the
    // variables scope to fulfill any variable references.
    // TODO: find a way to memoize, in case this field is within a List type.
    const args = getArgumentValues(
      fieldDef,
      fieldNodes[0],
      exeContext.variableValues,
    );

    // The resolve function's optional third argument is a context value that
    // is provided to every resolve function within an execution. It is commonly
    // used to represent an authenticated user, or request-specific caches.
    const context = exeContext.contextValue;

    const result = resolveFn(source, args, context, info);
    return isPromise(result) ? result.then(undefined, asErrorInstance) : result;
  } catch (error) {
    return asErrorInstance(error);
  }
}

// Sometimes a non-error is thrown, wrap it as an Error instance to ensure a
// consistent Error interface.
function asErrorInstance(error: mixed): Error {
  return error instanceof Error ? error : new Error(error || undefined);
}

// This is a small wrapper around completeValue which detects and logs errors
// in the execution context.
function completeValueCatchingError(
  exeContext: ExecutionContext,
  returnType: GraphQLOutputType,
  fieldNodes: $ReadOnlyArray<FieldNode>,
  info: GraphQLResolveInfo,
  path: ResponsePath,
  result: mixed,
  tracing: ObjMap<any>,
  fieldTrace: ObjMap<any>,
): MaybePromise<mixed> {
  // If the field type is non-nullable, then it is resolved without any
  // protection from errors, however it still properly locates the error.
  if (isNonNullType(returnType)) {
    return completeValueWithLocatedError(
      exeContext,
      returnType,
      fieldNodes,
      info,
      path,
      result,
      tracing,
      fieldTrace
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
      result,
      tracing,
      fieldTrace
    );
    if (isPromise(completed)) {
      // If `completeValueWithLocatedError` returned a rejected promise, log
      // the rejection error and resolve to null.
      // Note: we don't rely on a `catch` method, but we do expect "thenable"
      // to take a second callback for the error case.
      return completed.then(undefined,
        error => {
          completeTrace(fieldTrace, error);
          exeContext.errors.push(error);
          return Promise.resolve(null);
        },
      );
    }
    return completed;
  } catch (error) {
    // If `completeValueWithLocatedError` returned abruptly (threw an error),
    // log the error and return null.
    completeTrace(fieldTrace, error);
    exeContext.errors.push(error);
    return null;
  }
}

// This is a small wrapper around completeValue which annotates errors with
// location information.
function completeValueWithLocatedError(
  exeContext: ExecutionContext,
  returnType: GraphQLOutputType,
  fieldNodes: $ReadOnlyArray<FieldNode>,
  info: GraphQLResolveInfo,
  path: ResponsePath,
  result: mixed,
  tracing: ObjMap<any>,
  fieldTrace: ObjMap<any>,
): MaybePromise<mixed> {
  try {
    const completed = completeValue(
      exeContext,
      returnType,
      fieldNodes,
      info,
      path,
      result,
      tracing,
    );
    if (isPromise(completed)) {
      return completed.then(result => {
        completeTrace(fieldTrace);
        return result;
      }, error => {
        const locErr = locatedError(
          asErrorInstance(error),
          fieldNodes,
          responsePathAsArray(path),
        );
        completeTrace(fieldTrace, locErr);
        return Promise.reject(locErr);
      });
    }
    completeTrace(fieldTrace);
    return completed;
  } catch (error) {
    throw locatedError(
      asErrorInstance(error),
      fieldNodes,
      responsePathAsArray(path),
    );
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
  returnType: GraphQLOutputType,
  fieldNodes: $ReadOnlyArray<FieldNode>,
  info: GraphQLResolveInfo,
  path: ResponsePath,
  result: mixed,
  tracing: ObjMap<any>,
): MaybePromise<mixed> {
  // If result is a Promise, apply-lift over completeValue.
  if (isPromise(result)) {
    return result.then(resolved =>
      completeValue(
        exeContext,
        returnType,
        fieldNodes,
        info,
        path,
        resolved,
        tracing,
      ),
    );
  }

  // If result is an Error, throw a located error.
  if (result instanceof Error) {
    throw result;
  }

  // If field type is NonNull, complete for inner type, and throw field error
  // if result is null.
  if (isNonNullType(returnType)) {
    const completed = completeValue(
      exeContext,
      returnType.ofType,
      fieldNodes,
      info,
      path,
      result,
      tracing,
    );
    if (completed === null) {
      throw new Error(
        `Cannot return null for non-nullable field ${info.parentType.name}.${
          info.fieldName
        }.`,
      );
    }
    return completed;
  }

  // If result value is null-ish (null, undefined, or NaN) then return null.
  if (isNullish(result)) {
    return null;
  }

  // If field type is List, complete each item in the list with the inner type
  if (isListType(returnType)) {
    // $FlowFixMe
    return completeListValue(
      exeContext,
      returnType,
      fieldNodes,
      info,
      path,
      result,
      tracing,
    );
  }

  // If field type is a leaf type, Scalar or Enum, serialize to a valid value,
  // returning null if serialization is not possible.
  if (isLeafType(returnType)) {
    return completeLeafValue(returnType, result, tracing);
  }

  // If field type is an abstract type, Interface or Union, determine the
  // runtime Object type and complete for that type.
  if (isAbstractType(returnType)) {
    // $FlowFixMe
    return completeAbstractValue(
      exeContext,
      returnType,
      fieldNodes,
      info,
      path,
      result,
      tracing,
    );
  }

  // If field type is Object, execute and complete all sub-selections.
  if (isObjectType(returnType)) {
    // $FlowFixMe
    return completeObjectValue(
      exeContext,
      returnType,
      fieldNodes,
      info,
      path,
      result,
      tracing,
    );
  }

  // Not reachable. All possible output types have been considered.
  /* istanbul ignore next */
  throw new Error(
    `Cannot complete value of unexpected type "${String(
      (returnType: empty),
    )}".`,
  );
}

/**
 * Complete a list value by completing each item in the list with the
 * inner type
 */
function completeListValue(
  exeContext: ExecutionContext,
  returnType: GraphQLList<GraphQLOutputType>,
  fieldNodes: $ReadOnlyArray<FieldNode>,
  info: GraphQLResolveInfo,
  path: ResponsePath,
  result: mixed,
  tracing: ObjMap<any>,
): MaybePromise<$ReadOnlyArray<mixed>> {
  invariant(
    isCollection(result),
    `Expected Iterable, but did not find one for field ${
      info.parentType.name
    }.${info.fieldName}.`,
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

    // start a field trace
    const fieldTrace = {
      type: 'FIELD',
      resolver: exeContext.fieldResolver.name,
      path: pathToArray(fieldPath),
      location: null,
      parentType: String(info.parentType),
      fieldName: info.fieldName,
      returnType: String(returnType),
      start: getTime(),
      end: -1,
      duration: -1,
      error: null,
    };
    tracing.execution.resolvers.push(fieldTrace);

    const completedItem = completeValueCatchingError(
      exeContext,
      itemType,
      fieldNodes,
      info,
      fieldPath,
      item,
      tracing,
      fieldTrace
    );

    if (!containsPromise && isPromise(completedItem)) {
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
  result: mixed,
  tracing: ObjMap<any>,
): mixed {
  _.noop(tracing);
  invariant(returnType.serialize, 'Missing serialize method on type');
  const serializedResult = returnType.serialize(result);
  if (isInvalid(serializedResult)) {
    throw new Error(
      `Expected a value of type "${String(returnType)}" but ` +
        `received: ${String(result)}`,
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
  fieldNodes: $ReadOnlyArray<FieldNode>,
  info: GraphQLResolveInfo,
  path: ResponsePath,
  result: mixed,
  tracing: ObjMap<any>,
): MaybePromise<ObjMap<mixed>> {
  const runtimeType = returnType.resolveType
    ? returnType.resolveType(result, exeContext.contextValue, info)
    : defaultResolveTypeFn(result, exeContext.contextValue, info, returnType);

  if (isPromise(runtimeType)) {
    return runtimeType.then(resolvedRuntimeType =>
      completeObjectValue(
        exeContext,
        ensureValidRuntimeType(
          resolvedRuntimeType,
          exeContext,
          returnType,
          fieldNodes,
          info,
          result,
        ),
        fieldNodes,
        info,
        path,
        result,
        tracing,
      ),
    );
  }

  return completeObjectValue(
    exeContext,
    ensureValidRuntimeType(
      runtimeType,
      exeContext,
      returnType,
      fieldNodes,
      info,
      result,
    ),
    fieldNodes,
    info,
    path,
    result,
    tracing,
  );
}

function ensureValidRuntimeType(
  runtimeTypeOrName: ?GraphQLObjectType | string,
  exeContext: ExecutionContext,
  returnType: GraphQLAbstractType,
  fieldNodes: $ReadOnlyArray<FieldNode>,
  info: GraphQLResolveInfo,
  result: mixed,
): GraphQLObjectType {
  const runtimeType =
    typeof runtimeTypeOrName === 'string'
      ? exeContext.schema.getType(runtimeTypeOrName)
      : runtimeTypeOrName;

  if (!isObjectType(runtimeType)) {
    throw new GraphQLError(
      `Abstract type ${returnType.name} must resolve to an Object type at ` +
        `runtime for field ${info.parentType.name}.${info.fieldName} with ` +
        `value "${String(result)}", received "${String(runtimeType)}". ` +
        `Either the ${returnType.name} type should provide a "resolveType" ` +
        'function or each possible types should provide an ' +
        '"isTypeOf" function.',
      fieldNodes,
    );
  }

  if (!exeContext.schema.isPossibleType(returnType, runtimeType)) {
    throw new GraphQLError(
      `Runtime Object type "${runtimeType.name}" is not a possible type ` +
        `for "${returnType.name}".`,
      fieldNodes,
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
  fieldNodes: $ReadOnlyArray<FieldNode>,
  info: GraphQLResolveInfo,
  path: ResponsePath,
  result: mixed,
  tracing: ObjMap<any>,
): MaybePromise<ObjMap<mixed>> {
  // If there is an isTypeOf predicate function, call it with the
  // current result. If isTypeOf returns false, then raise an error rather
  // than continuing execution.
  if (returnType.isTypeOf) {
    const isTypeOf = returnType.isTypeOf(result, exeContext.contextValue, info);

    if (isPromise(isTypeOf)) {
      return isTypeOf.then(resolvedIsTypeOf => {
        if (!resolvedIsTypeOf) {
          throw invalidReturnTypeError(returnType, result, fieldNodes);
        }
        return collectAndExecuteSubfields(
          exeContext,
          returnType,
          fieldNodes,
          info,
          path,
          result,
          tracing,
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
    result,
    tracing,
  );
}

function invalidReturnTypeError(
  returnType: GraphQLObjectType,
  result: mixed,
  fieldNodes: $ReadOnlyArray<FieldNode>,
): GraphQLError {
  return new GraphQLError(
    `Expected value of type "${returnType.name}" but got: ${String(result)}.`,
    fieldNodes,
  );
}

function collectAndExecuteSubfields(
  exeContext: ExecutionContext,
  returnType: GraphQLObjectType,
  fieldNodes: $ReadOnlyArray<FieldNode>,
  info: GraphQLResolveInfo,
  path: ResponsePath,
  result: mixed,
  tracing: ObjMap<any>,
): MaybePromise<ObjMap<mixed>> {
  // Collect sub-fields to execute to complete this value.
  const subFieldNodes = collectSubfields(exeContext, returnType, fieldNodes);
  return executeFields(
    exeContext,
    returnType,
    result,
    path,
    subFieldNodes,
    tracing,
  );
}

/**
 * A memoized collection of relevant subfields in the context of the return
 * type. Memoizing ensures the subfields are not repeatedly calculated, which
 * saves overhead when resolving lists of values.
 */
const collectSubfields = memoize3(_collectSubfields);
function _collectSubfields(
  exeContext: ExecutionContext,
  returnType: GraphQLObjectType,
  fieldNodes: $ReadOnlyArray<FieldNode>,
): ObjMap<Array<FieldNode>> {
  let subFieldNodes = Object.create(null);
  const visitedFragmentNames = Object.create(null);
  for (let i = 0; i < fieldNodes.length; i++) {
    const selectionSet = fieldNodes[i].selectionSet;
    if (selectionSet) {
      const { fields, fragments } = collectFields(
        exeContext,
        returnType,
        selectionSet,
        subFieldNodes,
        visitedFragmentNames,
      );
      _.noop(fragments);
      subFieldNodes = fields;
    }
  }
  return subFieldNodes;
}

/**
 * If a resolveType function is not given, then a default resolve behavior is
 * used which attempts two strategies:
 *
 * First, See if the provided value has a `__typename` field defined, if so, use
 * that value as name of the resolved type.
 *
 * Otherwise, test each possible type for the abstract type by calling
 * isTypeOf for the object being coerced, returning the first type that matches.
 */
function defaultResolveTypeFn(
  value: mixed,
  context: mixed,
  info: GraphQLResolveInfo,
  abstractType: GraphQLAbstractType,
): ?GraphQLObjectType | string | Promise<?GraphQLObjectType | string> {
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

      if (isPromise(isTypeOfResult)) {
        promisedIsTypeOfResults[i] = isTypeOfResult;
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

/**
 * If a resolve function is not given, then a default resolve behavior is used
 * which takes the property of the source object of the same name as the field
 * and returns it as the result, or if it's a function, returns the result
 * of calling that function while passing along args and context.
 */
export const defaultFieldResolver: GraphQLFieldResolver<any, *> = function(
  source,
  args,
  context,
  info,
) {
  // ensure source is a value for which property access is acceptable.
  if (typeof source === 'object' || typeof source === 'function') {
    const property = source[info.fieldName];
    if (typeof property === 'function') {
      return source[info.fieldName](args, context, info);
    }
    return property;
  }
};

/**
 * This method looks up the field on the given type defintion.
 * It has special casing for the two introspection fields, __schema
 * and __typename. __typename is special because it can always be
 * queried as a field, even in situations where no other fields
 * are allowed, like on a Union. __schema could get automatically
 * added to the query type, but that would require mutating type
 * definitions, which would cause issues.
 */
export function getFieldDef(
  schema: GraphQLSchema,
  parentType: GraphQLObjectType,
  fieldName: string,
): ?GraphQLField<*, *> {
  if (
    fieldName === SchemaMetaFieldDef.name &&
    schema.getQueryType() === parentType
  ) {
    return SchemaMetaFieldDef;
  } else if (
    fieldName === TypeMetaFieldDef.name &&
    schema.getQueryType() === parentType
  ) {
    return TypeMetaFieldDef;
  } else if (fieldName === TypeNameMetaFieldDef.name) {
    return TypeNameMetaFieldDef;
  }
  return parentType.getFields()[fieldName];
}
