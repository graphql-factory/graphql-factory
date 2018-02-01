/**
 * Determines if the operation is a subscription and uses
 * subscribe method, otherwise regular graphql request
 */
import { lodash as _, getTime } from '../jsutils';
import {
  subscribe,
  parse,
  execute,
  validateSchema,
  validate
} from 'graphql';

export function request(...args) {
  return new Promise((resolve, reject) => {
    try {
      const start = getTime();

      // create an extensions object that will be merged with
      // rootValue.__extensions
      // tracing extensions loosely follows apollo tracing spec
      // https://github.com/apollographql/apollo-tracing
      const extensions = {
        tracing: {
          version: '1.0.0',
          start: -1,
          end: -1,
          duration: -1,
          resolverDuration: -1,
          overheadDuration: -1,
          parsing: {
            start: -1,
            end: -1,
            duration: -1
          },
          validation: {
            start: -1,
            end: -1,
            duration: -1
          },
          execution: {}
        }
      };

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

      const parsing = extensions.tracing.parsing;
      const validation = extensions.tracing.validation;

      // trace document parse
      parsing.start = getTime();
      const document = parse(source);
      parsing.end = getTime();
      parsing.duration = parsing.end - parsing.start;

      // trace validation
      // https://github.com/graphql/graphql-js/blob/master/src/graphql.js
      validation.start = getTime();
      const schemaValidationErrors = validateSchema(schema);
      if (schemaValidationErrors.length > 0) {
        return resolve({ errors: schemaValidationErrors });
      }
      const validationErrors = validate(schema, document);
      if (validationErrors.length > 0) {
        return resolve({ errors: validationErrors });
      }
      validation.end = getTime();
      validation.duration = validation.end - validation.start;

      // if rootValue is undefined, default to an object
      rootValue = rootValue === undefined ? {} : rootValue;

      // determine the operation type
      const operation = document.definitions.reduce((op, def) => {
        return typeof op === 'string' ? op : def.operation;
      }, null);

      switch (operation) {
        case 'query':
        case 'mutation':
          return Promise.resolve(
            execute(
              schema,
              document,
              rootValue,
              contextValue,
              variableValues,
              operationName,
              fieldResolver
            )
          )
          .then(results => {
            const end = getTime();

            // add extensions to the result
            const runtimeExt = _.get(rootValue, '__extensions', {});

            // check for extensions data option or if result has it
            if (extensionData && !_.has(results, 'extensions')) {
              const totalDuration = end - start;
              const resolverDuration = _.get(runtimeExt, 'resolverDuration', 0);
              _.set(runtimeExt, 'tracing.start', start);
              _.set(runtimeExt, 'tracing.end', end);
              _.set(runtimeExt, 'tracing.duration', totalDuration);
              _.set(
                runtimeExt,
                'tracing.overheadDuration',
                totalDuration -
                  validation.duration -
                  parsing.duration -
                  resolverDuration
              );
              _.set(results, 'extensions', _.merge(extensions, runtimeExt));
            }
            return resolve(results);
          })
          .catch(error => {
            return resolve({
              errors: [ error ]
            });
          });
        case 'subscription':
          return Promise.resolve(
            subscribe(
              schema,
              document,
              rootValue,
              contextValue,
              variableValues,
              operationName,
              fieldResolver,
              subscriptionFieldResolver
            )
          )
          .then(resolve)
          .catch(err => {
            resolve({
              errors: [ err ]
            });
          });
        default:
          throw new Error('Unable to determine valid operation from source');
      }
    } catch (err) {
      return reject({ errors: [ err ] });
    }
  });
}
