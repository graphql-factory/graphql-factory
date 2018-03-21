import { GraphQLError, Kind } from 'graphql';

export function getOperationNode(document, operationName) {
  const errors = [];
  const definitions = document.definitions;
  let operation = null;
  let hasMultipleAssumedOperations = false;
  for (let i = 0; i < definitions.length; i++) {
    const definition = definitions[i];
    if (definition.kind === Kind.OPERATION_DEFINITION) {
      if (!operationName && operation) {
        hasMultipleAssumedOperations = true;
      } else if (
        !operationName ||
        (definition.name && definition.name.value === operationName)
      ) {
        operation = definition;
      }
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
  return errors.length
    ? { errors, operation: undefined }
    : { errors: undefined, operation };
}
