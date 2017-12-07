/**
 * Determines if the operation is a subscription and uses
 * subscribe method, otherwise regular graphql request
 */
import { isObject } from '../jsutils';
import {
  graphql,
  subscribe,
  parse
} from 'graphql';

export function request(...args) {
  let [
    schema,
    source,
    rootValue,
    contextValue,
    variableValues,
    operationName,
    fieldResolver,
    subscriptionFieldResolver
  ] = args;

  if (args.length === 1) {
    if (!isObject(schema) || Array.isArray(schema)) {
      throw new Error('First argument must be GraphQLSchema ' +
      'or an arguments object');
    }
    source = schema.source;
    rootValue = schema.rootValue;
    contextValue = schema.contextValue;
    variableValues = schema.variableValues;
    operationName = schema.operationName;
    fieldResolver = schema.fieldResolver;
    subscriptionFieldResolver = schema.subscriptionFieldResolver;
    schema = schema.schema;
  }

  const document = parse(source);

  // determine the operation type
  const operation = document.definitions.reduce((op, def) => {
    return typeof op === 'string' ? op : def.operation;
  }, null);

  switch (operation) {
    case 'query':
    case 'mutation':
      return graphql(
        schema,
        source,
        rootValue,
        contextValue,
        variableValues,
        operationName,
        fieldResolver
      );
    case 'subscription':
      return subscribe(
        schema,
        document,
        rootValue,
        contextValue,
        variableValues,
        operationName,
        fieldResolver,
        subscriptionFieldResolver
      );
    default:
      throw new Error('Unable to determine valid operation from source');
  }
}
