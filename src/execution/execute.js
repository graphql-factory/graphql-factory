/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found at
 * https://github.com/graphql/graphql-js/blob/master/README.md
 *
 * ************************************************************
 * Modification Summary
 * ************************************************************
 * 
 * Changes from official graphql-js repo to support modified
 * execution behavior for graphql-factory
 * 
 * Modifications by Branden Horiuchi <bhoriuchi@gmail.com>
 *
 * Changed sections are annoted with #graphql-factory comments
 * 
 * - Added resolveRequest and resolveResult hooks for directives which
 *   provide the ability to run a middleware function depending on
 *   the location they are placed in.
 *
 *   * Directive placement - Since a directive can be placed
 *     on a definition and operation in more or less the same location
 *     the directive resolvers pass a locations argument that identifies
 *     what locations the directives were found in and what the arguments
 *     if any were at that location. This allows the developer to execute
 *     different code based on the directive location.
 *   * Directive request/result source - the source of a directive is based on
 *     its location. For example, a directive placed on an argument is scoped
 *     to that argument. The directive is able to return a new value for that
 *     argument only. Of course the resolver still has access to the operation
 *     via resolveInfo so access is not completely restricted.
 *
 *     Source by location:
 *       * SCHEMA
 *         - request: schema definition
 *         - result: Final result
 *       * OBJECT (rootType), QUERY, MUTATION, SUBSCRIPTION
 *         - request: rootType definition
 *         - result: Final result
 *       * OBJECT (non-rootType), SCALAR, INTERFACE, UNION,
 *         ENUM, INPUT_OBJECT
 *         - request: object definition
 *         - result: field object result
 *       * FIELD_DEFINITION, FIELD
 *         - request: fieldDefinition
 *         - result: field object result
 *
 *     Undetermined scopes:
 *       * FRAGEMENT_DEFINITION
 *       * FRAGMENT_SPREAD
 *       * INLINE_FRAGMENT
 *       * ARGUMENT_DEFINITION
 *       * ENUM_VALUE
 *       * INPUT_FIELD_DEFINITION
 * 
 * @flow
 */

import {
  GraphQLObjectType,
  getNamedType,
  GraphQLSchema,
  DirectiveLocation,
  assertValidExecutionArguments,
  buildExecutionContext,
  getOperationRootType,
  collectFields,
  addPath,
  getFieldDef,
  buildResolveInfo,
  getArgumentValues
} from '../types/graphql';
import type {
  ObjMap,
  GraphQLField,
  GraphQLFieldResolver,
  GraphQLResolveInfo,
  ResponsePath,
  DocumentNode,
  OperationDefinitionNode,
  FieldNode,
  ExecutionArgs,
  ExecutionResult,
  ExecutionContext,
} from '../types/graphql';

import {
  getDirectiveExec,
  reduceRequestDirectives,
  reduceResultDirectives,
  reduceLocationTree,
  wrapWithDirectives
} from './directives';
import type {
  DirectiveTree,
  DirectiveExec
} from './directives';
import {
  promiseForObject,
  getPromise,
  getFieldTypeLocation
} from '../jsutils';
import {
  completeValueCatchingError
} from './complete';
import {
  GraphQLSkipInstruction
} from '../types';

  /**
 * Implements the "Evaluating requests" section of the GraphQL specification.
 *
 * Returns a Promise that will eventually be resolved and never rejected.
 *
 * If the arguments to this function do not result in a legal execution context,
 * a GraphQLError will be thrown immediately explaining the invalid input.
 *
 * Accepts either an object with named arguments, or individual arguments.
 */
declare function execute(
  ExecutionArgs,
  ..._: []
): Promise<ExecutionResult>;
/* eslint-disable no-redeclare */
declare function execute(
  schema: GraphQLSchema,
  document: DocumentNode,
  rootValue?: mixed,
  contextValue?: mixed,
  variableValues?: ?{[variable: string]: mixed},
  operationName?: ?string,
  fieldResolver?: ?GraphQLFieldResolver<any, any>
): Promise<ExecutionResult>;

export function execute(
  argsOrSchema,
  document,
  rootValue,
  contextValue,
  variableValues,
  operationName,
  fieldResolver
) {
  // Extract arguments from object args if provided.
  return arguments.length === 1 ?
    executeImpl(
      argsOrSchema.schema,
      argsOrSchema.document,
      argsOrSchema.rootValue,
      argsOrSchema.contextValue,
      argsOrSchema.variableValues,
      argsOrSchema.operationName,
      argsOrSchema.fieldResolver
    ) :
    executeImpl(
      argsOrSchema,
      document,
      rootValue,
      contextValue,
      variableValues,
      operationName,
      fieldResolver
    );
}

function executeImpl(
  schema,
  document,
  rootValue,
  contextValue,
  variableValues,
  operationName,
  fieldResolver
) {
  // If arguments are missing or incorrect, throw an error.
  assertValidExecutionArguments(
    schema,
    document,
    variableValues
  );

  // If a valid context cannot be created due to incorrect arguments,
  // a "Response" with only errors is returned.
  let context;
  try {
    context = buildExecutionContext(
      schema,
      document,
      rootValue,
      contextValue,
      variableValues,
      operationName,
      fieldResolver
    );
  } catch (error) {
    return Promise.resolve({ errors: [ error ] });
  }

  // Return a Promise that will eventually resolve to the data described by
  // The "Response" section of the GraphQL specification.
  //
  // If errors are encountered while executing a GraphQL field, only that
  // field and its descendants will be omitted, and sibling fields will still
  // be executed. An execution which encounters errors will still result in a
  // resolved Promise.
  return Promise.resolve(
    executeOperation(context, context.operation, rootValue)
  )
  .then(data => context.errors.length === 0 ?
    { data } :
    { errors: context.errors, data }
  );
}

/**
 * Implements the "Evaluating operations" section of the spec.
 */
function executeOperation(
  exeContext: ExecutionContext,
  operation: OperationDefinitionNode,
  rootValue: mixed
): ?(Promise<?ObjMap<mixed>> | ObjMap<mixed>) {
  const type = getOperationRootType(exeContext.schema, operation);
  const fields = collectFields(
    exeContext,
    type,
    operation.selectionSet,
    Object.create(null),
    Object.create(null)
  );

  const path = undefined;

  // #graphql-factory - get the directives that can be applied
  // on the schema definition
  const schemaDirectives = getDirectiveExec(
    exeContext.schema,
    [
      {
        location: DirectiveLocation.SCHEMA,
        astNode: exeContext.schema.astNode
      }
    ],
    exeContext.variableValues
  );

  // #graphql-factory - get the directives that can be applied
  // on the operation
  const operationDirectives = getDirectiveExec(
    exeContext.schema,
    [
      {
        astNode: type.astNode,
        location: DirectiveLocation.OBJECT
      },
      {
        astNode: operation,
        location: operation.operation === 'query' ?
          DirectiveLocation.QUERY :
          operation.operation === 'mutation' ?
            DirectiveLocation.MUTATION :
            DirectiveLocation.SUBSCRIPTION
      }
    ],
    exeContext.variableValues
  );

  const schemaDirectiveTree = Object.freeze({
    parent: null,
    directives: reduceLocationTree(schemaDirectives)
  })
  const operationDirectiveTree = Object.freeze({
    parent: schemaDirectiveTree,
    directives: reduceLocationTree(operationDirectives)
  })

  // #graphql-factory - wrap the directives and reduce
  return wrapWithDirectives(
    exeContext,
    {
      directiveExecs: schemaDirectives,
      directiveTree: schemaDirectiveTree,
      source: undefined,
      args: () => undefined
    },
    {
      directiveExecs: operationDirectives,
      directiveTree: operationDirectiveTree,
      source: undefined,
      args: () => undefined
    },
    () => {
      return operation.operation === 'mutation' ?
        executeFieldsSerially(exeContext, type, rootValue, path, fields) :
        executeFields(
          exeContext,
          type,
          rootValue,
          path,
          fields,
          operationDirectiveTree
        );
    },
    false
  );
}

  /**
 * Implements the "Evaluating selection sets" section of the spec
 * for "write" mode.
 * TODO: This needs directive reduce implmeneted
 */
function executeFieldsSerially(
  exeContext: ExecutionContext,
  parentType: GraphQLObjectType,
  sourceValue: mixed,
  path: ResponsePath,
  fields: ObjMap<Array<FieldNode>>,
): Promise<ObjMap<mixed>> {
  return Object.keys(fields).reduce(
    (prevPromise, responseName) => prevPromise.then(results => {
      const fieldNodes = fields[responseName];
      const fieldPath = addPath(path, responseName);
      const result = resolveField(
        exeContext,
        parentType,
        sourceValue,
        fieldNodes,
        fieldPath,
        {}
      );
      if (result === undefined) {
        return results;
      }
      const promise = getPromise(result);
      if (promise) {
        return promise.then(resolvedResult => {
          results[responseName] = resolvedResult;
          return results;
        });
      }
      results[responseName] = result;
      return results;
    }),
    Promise.resolve({})
  );
}

/**
  * Implements the "Evaluating selection sets" section of the spec
  * for "read" mode.
  */
export function executeFields(
  exeContext: ExecutionContext,
  parentType: GraphQLObjectType,
  sourceValue: mixed,
  path: ResponsePath,
  fields: ObjMap<Array<FieldNode>>,
  parentLocationTree: DirectiveTree
): Promise<ObjMap<mixed>> | ObjMap<mixed> {
  const finalResults = Object.keys(fields).reduce(
    (results, responseName) => {
      const _results = results || {};
      const fieldNodes = fields[responseName];
      const fieldPath = addPath(path, responseName);

      // #graphql-factory - get additional information
      const fieldNode = fieldNodes[0];
      const fieldName = fieldNode.name.value;
      const fieldDef = getFieldDef(exeContext.schema, parentType, fieldName);
      if (!fieldDef) {
        return _results;
      }

      // get the type directives
      const type = getNamedType(fieldDef.type);
      const typeDirectives = getDirectiveExec(
        exeContext.schema,
        [
          {
            location: getFieldTypeLocation(fieldDef.type),
            astNode: type.astNode
          }
        ],
        exeContext.variableValues
      );

      // get the field directives
      const fieldDirectives = getDirectiveExec(
        exeContext.schema,
        [
          {
            location: DirectiveLocation.FIELD_DEFINITION,
            astNode: fieldDef.astNode
          },
          {
            location: DirectiveLocation.FIELD,
            astNode: fieldNodes[0]
          }
        ],
        exeContext.variableValues
      );

      const directiveTree = {
        parent: parentLocationTree,
        directives: reduceLocationTree(
          typeDirectives.concat(fieldDirectives)
        )
      };

      const getArgs = () => {
        return getArgumentValues(
          fieldDef,
          fieldNodes[0],
          exeContext.variableValues
        )
      }

      // #graphql-factory - add the response, if it is undefined or a skip, the
      // promiseForObject function will filter it out of the result
      _results[responseName] = wrapWithDirectives(
        exeContext,
        {
          directiveExecs: typeDirectives,
          directiveTree: directiveTree,
          source: undefined,
          args: getArgs
        },
        {
          directiveExecs: fieldDirectives,
          directiveTree: directiveTree,
          source: undefined,
          args: getArgs
        },
        () => {
          return resolveField(
            exeContext,
            parentType,
            sourceValue,
            fieldNodes,
            fieldPath,
            directiveTree
          );
        },
        true
      );

      // return the updated results
      return _results;
    },
    Object.create(null)
  );

  // Otherwise, results is a map from field name to the result
  // of resolving that field, which is possibly a promise. Return
  // a promise that will return this same map, but with any
  // promises replaced with the values they resolved to.
  return promiseForObject(finalResults);
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
  fieldNodes: Array<FieldNode>,
  path: ResponsePath,
  parentDirectiveTree: DirectiveTree
): mixed {
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
    path
  );

  // Get the resolve function, regardless of if its result is normal
  // or abrupt (error).
  const result = resolveFieldValueOrError(
    exeContext,
    fieldDef,
    fieldNodes,
    resolveFn,
    source,
    info
  );

  return completeValueCatchingError(
    exeContext,
    fieldDef.type,
    fieldNodes,
    info,
    path,
    result,
    parentDirectiveTree
  );
}

// Isolates the "ReturnOrAbrupt" behavior to not de-opt the `resolveField`
// function. Returns the result of resolveFn or the abrupt-return Error object.
export function resolveFieldValueOrError<TSource>(
  exeContext: ExecutionContext,
  fieldDef: GraphQLField<TSource, *>,
  fieldNodes: Array<FieldNode>,
  resolveFn: GraphQLFieldResolver<TSource, *>,
  source: TSource,
  info: GraphQLResolveInfo
): Error | mixed {
  try {
    // Build a JS object of arguments from the field.arguments AST, using the
    // variables scope to fulfill any variable references.
    // TODO: find a way to memoize, in case this field is within a List type.
    const args = getArgumentValues(
      fieldDef,
      fieldNodes[0],
      exeContext.variableValues
    );

    // The resolve function's optional third argument is a context value that
    // is provided to every resolve function within an execution. It is commonly
    // used to represent an authenticated user, or request-specific caches.
    const context = exeContext.contextValue;

    return resolveFn(source, args, context, info);
  } catch (error) {
    // Sometimes a non-error is thrown, wrap it as an Error for a
    // consistent interface.
    return error instanceof Error ? error : new Error(error);
  }
}
