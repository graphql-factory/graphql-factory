/**
 * Determines if the operation is a subscription and uses
 * subscribe method, otherwise regular graphql request
 */
import { lodash as _ } from '../jsutils';
import { graphql, subscribe, parse } from 'graphql';

export function request(...args) {
  let extensionData = true;
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
    if (!_.isObjectLike(schema) || _.isArray(schema)) {
      throw new Error('First argument must be GraphQLSchema ' +
      'or an arguments object');
    }

    // standard
    source = schema.source;
    rootValue = schema.rootValue;
    contextValue = schema.contextValue;
    variableValues = schema.variableValues;
    operationName = schema.operationName;
    fieldResolver = schema.fieldResolver;
    subscriptionFieldResolver = schema.subscriptionFieldResolver;

    // options
    extensionData = schema.extensionData !== false;

    // set schema to the actual schema value, this must always go last
    schema = schema.schema;
  }

  const document = parse(source);

  // if rootValue is undefined, default to an object
  rootValue = rootValue === undefined ? {} : rootValue;

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
      )
      .then(results => {
        // add extensions to the result
        const extensions = _.get(rootValue, '__extensions', {});
        return !_.has(results, 'extensions') && extensionData ?
          _.set(results, 'extensions', extensions) :
          results;
      })
      .catch(error => {
        return Promise.reject(error);
      });
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
