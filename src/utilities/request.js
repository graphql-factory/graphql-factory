/**
 * Determines if the operation is a subscription and uses
 * subscribe method, otherwise regular graphql request
 */
import { lodash as _, getTime, isPromise } from '../jsutils';
import { subscribe, parse, validateSchema, validate } from 'graphql';
import { execute } from '../execution/execute';

/**
 * Resolves the schema definition build before
 * performing the request
 * @param {*} schema
 */
function resolveBuild(schema) {
  const build = _.get(schema, 'definition._build');
  return isPromise(build) ? build : Promise.resolve();
}

export function request(...args) {
  return new Promise((resolve, reject) => {
    try {
      const start = getTime();

      // tracing extensions loosely follows apollo tracing spec
      // https://github.com/apollographql/apollo-tracing
      const tracing = {
        version: '1.0.0',
        start,
        end: -1,
        duration: -1,
        resolverDuration: -1,
        overheadDuration: -1,
        parsing: {
          start: -1,
          end: -1,
          duration: -1,
        },
        validation: {
          start: -1,
          end: -1,
          duration: -1,
        },
        execution: {},
      };

      let [
        schema,
        source,
        rootValue,
        contextValue,
        variableValues,
        operationName,
        fieldResolver,
        subscriptionFieldResolver,
        extensions,
      ] = args;

      if (args.length === 1) {
        if (!_.isObjectLike(schema) || _.isArray(schema)) {
          throw new Error(
            'First argument must be GraphQLSchema ' + 'or an arguments object',
          );
        }

        // standard
        source = schema.source;
        rootValue = schema.rootValue;
        contextValue = schema.contextValue;
        variableValues = schema.variableValues;
        operationName = schema.operationName;
        fieldResolver = schema.fieldResolver;
        subscriptionFieldResolver = schema.subscriptionFieldResolver;
        extensions = schema.extensions;

        // set schema to the actual schema value, this must always go last
        // because it will overwrite the execution arguments object variable
        schema = schema.schema;
      }

      const parsing = tracing.parsing;
      const validation = tracing.validation;

      // now resolve the build
      return resolveBuild(schema)
        .then(() => {
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
                  fieldResolver,
                  tracing,
                ),
              )
                .then(results => {
                  // inject the tracing extension if an extensions
                  // object was passed as a parameter
                  if (_.isObject(extensions) && !_.has(extensions, 'tracing')) {
                    extensions.tracing = tracing;
                  }
                  return resolve(results);
                })
                .catch(error => {
                  return resolve({
                    errors: [error],
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
                  subscriptionFieldResolver,
                ),
              )
                .then(resolve)
                .catch(err => {
                  resolve({
                    errors: [err],
                  });
                });
            default:
              throw new Error(
                'Unable to determine valid operation from source',
              );
          }
        })
        .catch(reject);
    } catch (err) {
      return reject({ errors: [err] });
    }
  });
}
