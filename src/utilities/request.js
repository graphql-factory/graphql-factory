import {
  promiseReduce,
  isArray,
  isObject,
  isPromise,
  filterKeys,
  hasOwn,
  lodash as _,
} from '../jsutils';
import { FactoryExtensionMap } from '../extensions/FactoryExtensionMap';
import { applyDirectiveVisitors } from '../middleware/directive';
import {
  Kind,
  execute,
  subscribe,
  validateSchema,
  validate,
  GraphQLError,
} from 'graphql';

function isWellFormedResponse(response) {
  return (
    isObject(response) &&
    !filterKeys(response, ['errors', 'data', 'extensions']).length &&
    (!isArray(response, 'errors') || isArray(response, 'errors', 1))
  );
}

function addExtensions(response, extensionMap, extensions) {
  return extensions
    ? Object.assign(response, { extensions: extensionMap.data })
    : response;
}

export function request(...args) {
  let executionResult;
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
    extensionData,
  ] = args;

  if (args.length === 1) {
    if (!isObject(schema) || Array.isArray(schema)) {
      return Promise.resolve({
        errors: [
          new GraphQLError(
            'first argument must be GraphQLSchema ' + 'or an arguments object',
          ),
        ],
      });
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
    extensionData = schema.extensionData;

    // set schema to the actual schema value, this must always go last
    // because it will overwrite the execution arguments object variable
    schema = schema.schema;
  }

  const malformedError = new GraphQLError(
    'malformed response, ' +
      'verify middleware returns correclty structured ' +
      'response data',
  );
  const extensionMap = new FactoryExtensionMap(extensions, extensionData);
  extensionMap.requestStarted();
  extensionMap.parsingStarted();

  const {
    errors,
    runtimeSchema,
    document,
    before,
    after,
  } = applyDirectiveVisitors(schema, source, variableValues, extensionMap);
  extensionMap.parsingEnded();

  if (errors) {
    extensionMap.requestEnded();
    return !extensions ? { errors } : { errors, extensions: extensionMap.data };
  }

  extensionMap.validationStarted();
  const schemaValidationErrors = validateSchema(runtimeSchema);
  if (schemaValidationErrors.length > 0) {
    extensionMap.validationEnded();
    extensionMap.requestEnded();
    return Promise.resolve(
      !extensions
        ? { errors: schemaValidationErrors }
        : { errors: schemaValidationErrors, extensions: extensionMap.data },
    );
  }
  const validationErrors = validate(runtimeSchema, document);
  if (validationErrors.length > 0) {
    extensionMap.validationEnded();
    extensionMap.requestEnded();
    return Promise.resolve(
      !extensions
        ? { errors: validationErrors }
        : { errors: validationErrors, extensions: extensionMap.data },
    );
  }
  extensionMap.validationEnded();
  extensionMap.executionStarted();
  const operation = document.definitions[0].operation;
  const execution =
    operation === 'subscription'
      ? () => {
          return subscribe(
            runtimeSchema,
            document,
            rootValue,
            contextValue,
            variableValues,
            operationName,
            fieldResolver,
            subscriptionFieldResolver,
          );
        }
      : () => {
          return execute(
            runtimeSchema,
            document,
            rootValue,
            contextValue,
            variableValues,
            operationName,
            fieldResolver,
          );
        };

  const resolveQueue = before
    .concat({
      level: 'execution',
      type: operation,
      class: 'execution',
      name: execution.name || operation,
      resolve: execution,
      args: {},
    })
    .concat(after);

  // check for pending build tasks in the definition
  // if there are, set the initial value to resolve
  // them first, otherwise use the rootValue
  const build = _.get(runtimeSchema, 'definition._build');
  const initialValue = isPromise(build)
    ? build.then(() => rootValue)
    : rootValue;

  const fragments = document.definitions.reduce((frags, definition) => {
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      frags[definition.name.value] = definition;
    }
    return frags;
  }, {});

  let detailedMap;
  const result = promiseReduce(
    resolveQueue,
    (src, current) => {
      if (detailedMap) {
        extensionMap.resolverEnded(detailedMap);
      }
      detailedMap = extensionMap.resolverStarted(undefined, current);

      if (current.type === 'after' && isWellFormedResponse(src)) {
        executionResult = source;
      }

      try {
        return current.resolve(
          executionResult || src,
          current.args,
          contextValue,
          {
            fieldName: undefined,
            fieldNodes: [],
            returnType: undefined,
            parentType: undefined,
            schema: runtimeSchema,
            fragments,
            rootValue,
            operation: document.definitions[0],
            variableValues,
          },
        );
      } catch (err) {
        return Promise.reject(err);
      }
    },
    initialValue,
  );

  return Promise.resolve(result)
    .then(finalResult => {
      extensionMap.resolverEnded(detailedMap);
      extensionMap.executionEnded();
      extensionMap.requestEnded();

      if (isWellFormedResponse(finalResult)) {
        return addExtensions(finalResult, extensionMap, extensions);
      }

      const correctedResult = {
        data: hasOwn(finalResult, 'data')
          ? finalResult.data
          : hasOwn(executionResult, 'data') ? executionResult.data : null,
        errors: isArray(finalResult, 'errors')
          ? finalResult.errors
          : isArray(executionResult, 'errors') ? executionResult.errors : [],
      };
      correctedResult.errors.push(malformedError);
      return addExtensions(correctedResult, extensionMap, extensions);
    })
    .catch(err => {
      extensionMap.resolverEnded(detailedMap);
      extensionMap.executionEnded();
      extensionMap.requestEnded();

      if (isWellFormedResponse(executionResult)) {
        executionResult.errors = isArray(executionResult, 'errors')
          ? executionResult.errors
          : [];
        executionResult.errors.push(err);
        return Promise.resolve(executionResult);
      }
      return Promise.resolve({
        errors: [err, malformedError],
      });
    });
}
