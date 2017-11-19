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
 * @flow
 */
import type {
  GraphQLField,
  GraphQLDirective,
  FieldNode,
  DirectiveNode,
  ObjMap,
  VariableNode,
  ExecutionContext
} from '../types/graphql';
import {
  keyMap,
  isInvalid,
  GraphQLNonNull,
  GraphQLError,
  Kind,
  valueFromAST,
  isValidLiteralValue,
  print,
  DirectiveLocation
} from '../types/graphql';
import type {
  DirectiveTree
} from './directives';
import {
  getDirectiveExec,
  reduceRequestDirectives,
  reduceResultDirectives
} from './directives';
import {
  promiseReduce
} from '../jsutils';
import { GraphQLSkipInstruction } from '../types/instruction';
/**
 * Prepares an object map of argument values given a list of argument
 * definitions and list of argument AST nodes.
 *
 * Note: The returned value is a plain Object with a prototype, since it is
 * exposed to user code. Care should be taken to not pull values from the
 * Object prototype.
 */
export function getArgumentValues(
  exeContext: ExecutionContext,
  def: GraphQLField<*, *> | GraphQLDirective,
  node: FieldNode | DirectiveNode,
  variableValues?: ?ObjMap<mixed>,
  directiveTree: DirectiveTree,
  details: Array<?mixed>,
  isResult: boolean
): Promise<?mixed> {
  const reducer = isResult ?
    reduceResultDirectives :
    reduceRequestDirectives;

  const argDefs = def.args;
  const argNodes = node.arguments;
  if (!argDefs || !argNodes) {
    return Promise.resolve({});
  }

  const argNodeMap = keyMap(argNodes, arg => arg.name.value);

  return promiseReduce(
    argDefs,
    (coercedValues, argDef) => {
      let value;
      const name = argDef.name;
      const argType = argDef.type;
      const argumentNode = argNodeMap[name];
      const defaultValue = argDef.defaultValue;

      if (!argumentNode) {
        if (!isInvalid(defaultValue)) {
          value = defaultValue;
        } else if (argType instanceof GraphQLNonNull) {
          throw new GraphQLError(
            `Argument "${name}" of required type ` +
            `"${String(argType)}" was not provided.`,
            [ node ]
          );
        }
      } else if (argumentNode.value.kind === Kind.VARIABLE) {
        const variableName = (argumentNode.value: VariableNode).name.value;
        if (
          variableValues &&
          Object.prototype.hasOwnProperty.call(variableValues, variableName) &&
          !isInvalid(variableValues[variableName])
        ) {
          // Note: this does not check that this variable value is correct.
          // This assumes that this query has been validated and the variable
          // usage here is of the correct type.
          value = variableValues[variableName];
        } else if (!isInvalid(defaultValue)) {
          value = defaultValue;
        } else if (argType instanceof GraphQLNonNull) {
          throw new GraphQLError(
            `Argument "${name}" of required type "${String(argType)}" was ` +
            `provided the variable "$${variableName}" which was not ` +
            'provided a runtime value.',
            [ argumentNode.value ]
          );
        }
      } else {
        const valueNode = argumentNode.value;
        const coercedValue = valueFromAST(valueNode, argType, variableValues);
        if (isInvalid(coercedValue)) {
          const errors = isValidLiteralValue(argType, valueNode);
          const message = errors ? '\n' + errors.join('\n') : '';
          throw new GraphQLError(
            `Argument "${name}" got invalid value ` +
            `${print(valueNode)}.${message}`,
            [ argumentNode.value ]
          );
        }
        value = coercedValue;
      }

      const directiveExec = getDirectiveExec(
        exeContext.schema,
        [
          {
            location: DirectiveLocation.INPUT_FIELD_DEFINITION,
            astNode: argDef.astNode
          }
        ],
        variableValues
      );

      return reducer(
        exeContext,
        directiveExec,
        details,
        undefined,
        directiveTree
      )
        .then(result => {
          if (!(result instanceof GraphQLSkipInstruction)) {
            if (value !== undefined || result !== undefined) {
              coercedValues[name] = result === undefined ?
              value :
              result;
            }
          }
          return coercedValues;
        });
    },
    {}
  );
}
