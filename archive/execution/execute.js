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
 *   * Directive placement - At a high level directive locations can 
 *     be grouped into definitions and operations. GraphQL Factory 
 *     allows definition locations to overlap when executing resolver 
 *     functions and resolver functions are executed/reduced at specific 
 *     positions in the execution lifecycle as described in the next section.
 * 
 *     It should also be noted that directives with resolvers
 *     at the same location will be reduced in order of declaration where the 
 *     result of the previous is fed into the source of the current.
 * 
 *     GraphQLSkipInstruction
 *     instances will immediately skip the remaining resolvers in the current 
 *     reduction
 *     
 *   * resolveRequest and resolveResult
 *     Directives can have either of the following resolvers applied to
 *     them in order to execute code at specific points in the execution
 *     lifecycle. In general all resolvers have access to the same args,
 *     context, and a subset of the resolveInfo. Sources will vary based
 *     on what the resolve type is and where in the lifecycle it is called.
 * 
 *     * resolveRequest - run before a field/fields are resolved. source 
 *       is typically undefined or an instruction
 *     * resolveResult - run after a field/fields are resolved. source is
 *       the complete result or a field resolve result depending on location
 *     * resolveInfo - an additional value "directives" is added to each
 *       resolve info with a tree of directives, their locations and arguments
 *       up until the current fields location. This serves to give the
 *       resolve function enough information to run location specific code
 * 
 *   * Execution Lifecycle
 *     This section will identify directive locations and when they are 
 *     executed in the execution lifecycle
 * 
 *     * SCHEMA
 *       - resolveRequest: executed first before any other directive resolvers 
 *         or field resolvers. source is undefined. A GraphQLSkipInstruction 
 *         returned here will return an undefined result
 *       - resolveResult: executed just before returning the final results. 
 *         source is the result and can be modified and returned
 *     * RootType (OBJECT) & Operation (QUERY, MUTATION, SUBSCRIPTION)
 *       - resolveRequest: executed after the SCHEMA directive resolveRequest 
 *         reduction. source is undefined
 *       - resolveResult: run just after all fields have been resolved and a 
 *         result is completed. This is also just before the SCHEMA 
 *         resolveResult reduction runs. source is the complete result
 *     * FIELD, FIELD_DEFINITION, SCALAR, OBJECT, INTERFACE, UNION, ENUM
 *       - resolveRequest: executed on each field/subfield. Types are reduced
 *         before the FIELD_DEFINITION which is before the FIELD. source is
 *         undefined. Returning a GraphQLSkipInstruction here will remove the 
 *         field from the result
 *       - resolveResult: executed after the field has been resolved. source
 *         is the value of the field. Returning a GraphQLSkipInstruction
 *         here will remove the field from the result
 * 
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
  buildResolveInfo
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
  reduceLocationTree,
  wrapWithDirectives
} from './directives';
import type {
  DirectiveTree
} from './directives';
import {
  promiseForObject,
  getPromise,
  getFieldTypeLocation,
  cloneDeep
} from '../jsutils';
import {
  completeValueCatchingError
} from './complete';
import {
  getArgumentValues
} from './values';
import {
  ExecutionLogger
} from '../types';
import {
  LoggerDetailType
} from '../types/logger';

/**
 * Implements the "Evaluating requests" section of the GraphQL specification.
 *
 * Returns a Promise that will eventually be resolved and never rejected.
 *
 * If the arguments to this function do not result in a legal execution 
 * context, a GraphQLError will be thrown immediately explaining the 
 * invalid input.
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
  fieldResolver?: ?GraphQLFieldResolver<any, any>,
  logger?: ?ExecutionLogger
): Promise<ExecutionResult>;

export function execute(
  argsOrSchema,
  document,
  rootValue,
  contextValue,
  variableValues,
  operationName,
  fieldResolver,
  logger
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
      argsOrSchema.fieldResolver,
      argsOrSchema.logger
    ) :
    executeImpl(
      argsOrSchema,
      document,
      rootValue,
      contextValue,
      variableValues,
      operationName,
      fieldResolver,
      logger
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
  logger
) {
  // If arguments are missing or incorrect, throw an error.
  assertValidExecutionArguments(
    schema,
    document,
    variableValues
  );

  // ensure logger is a function if not specified
  const _logger = typeof logger === 'function' ?
  logger :
  function (...args) {
    return [ ...args ];
  };

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

  const details = {
    start: Date.now(),
    end: -1,
    duration: -1,
    operationDefinition: context.operation,
    execution: []
  };

  // Return a Promise that will eventually resolve to the data described by
  // The "Response" section of the GraphQL specification.
  //
  // If errors are encountered while executing a GraphQL field, only that
  // field and its descendants will be omitted, and sibling fields will still
  // be executed. An execution which encounters errors will still result in a
  // resolved Promise.
  return Promise.resolve(
    executeOperation(
      context,
      context.operation,
      rootValue,
      details
    )
  )
  .then(data => {
    details.end = Date.now();
    details.duration = details.end - details.start;

    _logger('execution', details);
    return context.errors.length === 0 ?
      { data } :
      { errors: context.errors, data };
  });
}

/**
 * Implements the "Evaluating operations" section of the spec.
 */
function executeOperation(
  exeContext: ExecutionContext,
  operation: OperationDefinitionNode,
  rootValue: mixed,
  details: ObjMap<mixed>
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
  });
  const operationDirectiveTree = Object.freeze({
    parent: schemaDirectiveTree,
    directives: reduceLocationTree(operationDirectives)
  });

  // #graphql-factory - wrap the directives and reduce
  return wrapWithDirectives(
    exeContext,
    {
      directiveExecs: schemaDirectives,
      directiveTree: schemaDirectiveTree,
      details: details.execution,
      source: undefined,
      args: undefined
    },
    {
      directiveExecs: operationDirectives,
      directiveTree: operationDirectiveTree,
      details: details.execution,
      source: undefined,
      args: undefined
    },
    () => {
      return operation.operation === 'mutation' ?
        executeFieldsSerially(
          exeContext,
          type,
          rootValue,
          path,
          fields,
          operationDirectiveTree,
          details.execution
        ) :
        executeFields(
          exeContext,
          type,
          rootValue,
          path,
          fields,
          operationDirectiveTree,
          details.execution
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
  parentDirectiveTree: DirectiveTree,
  details: Array<?mixed>,
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
        parentDirectiveTree,
        details,
        responseName
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
  parentDirectiveTree: DirectiveTree,
  details: Array<?mixed>,
): Promise<ObjMap<mixed>> | ObjMap<mixed> {
  let containsPromise = false;

    const finalResults = Object.keys(fields).reduce(
      (results, responseName) => {
        const fieldNodes = fields[responseName];
        const fieldPath = addPath(path, responseName);
        const result = resolveField(
          exeContext,
          parentType,
          sourceValue,
          fieldNodes,
          fieldPath,
          parentDirectiveTree,
          details,
          responseName
        );
        if (result === undefined) {
          return results;
        }
        results[responseName] = result;
        if (getPromise(result)) {
          containsPromise = true;
        }
        return results;
      },
      Object.create(null)
    );

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

/**
 * Resolves the field on the given source object. In particular, this
 * figures out the value that the field returns by calling its resolve 
 * function, then calls completeValue to complete promises, serialize 
 * scalars, or execute the sub-selection-set for objects.
 */
function resolveField(
  exeContext: ExecutionContext,
  parentType: GraphQLObjectType,
  source: mixed,
  fieldNodes: Array<FieldNode>,
  path: ResponsePath,
  parentDirectiveTree: DirectiveTree,
  details: Array<?mixed>,
  responseName: string
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
    parent: parentDirectiveTree,
    directives: reduceLocationTree(
      typeDirectives.concat(fieldDirectives)
    )
  };

  // #graphql 
  return getArgumentValues(
    exeContext,
    fieldDef,
    fieldNodes[0],
    exeContext.variableValues,
    directiveTree,
    details,
    false
  )
  .then(args => {
    const execDetails = {
      type: LoggerDetailType.FIELD,
      name: responseName,
      resolver: resolveFn.name || responseName,
      start: Date.now(),
      end: 0,
      duration: 0,
      args: args || {},
      error: null,
      resolves: []
    };

    if (fieldDef.resolve) {
      details.push(execDetails);
    }

    return wrapWithDirectives(
      exeContext,
      {
        directiveExecs: typeDirectives,
        directiveTree,
        details,
        source: undefined,
        args: cloneDeep(args)
      },
      {
        directiveExecs: fieldDirectives,
        directiveTree,
        details,
        source: undefined,
        args: cloneDeep(args)
      },
      () => {
        // Get the resolve function, regardless of if its result is normal
        // or abrupt (error).
        const result = resolveFieldValueOrError(
          exeContext,
          fieldDef,
          fieldNodes,
          resolveFn,
          source,
          info,
          args
        );

        return completeValueCatchingError(
          exeContext,
          fieldDef.type,
          fieldNodes,
          info,
          path,
          result,
          parentDirectiveTree,
          execDetails
        );
      },
      true
    );
  });
}

// Isolates the "ReturnOrAbrupt" behavior to not de-opt the `resolveField`
// function. Returns the result of resolveFn or the abrupt-return Error object.
export function resolveFieldValueOrError<TSource>(
  exeContext: ExecutionContext,
  fieldDef: GraphQLField<TSource, *>,
  fieldNodes: Array<FieldNode>,
  resolveFn: GraphQLFieldResolver<TSource, *>,
  source: TSource,
  info: GraphQLResolveInfo,
  args: mixed
): Error | mixed {
  try {
    // The resolve function's optional third argument is a context value that
    // is provided to every resolve function within an execution. It is 
    // commonly used to represent an authenticated user, or request-specific 
    // caches.
    const context = exeContext.contextValue;

    return resolveFn(source, args, context, info);
  } catch (error) {
    // Sometimes a non-error is thrown, wrap it as an Error for a
    // consistent interface.
    return error instanceof Error ? error : new Error(error);
  }
}
