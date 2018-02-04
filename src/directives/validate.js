import { assert, get } from '../jsutils';
import { DirectiveLocation } from 'graphql';
import { GraphQLOmitTraceInstruction } from '../types';

function getValidator(info, args) {
  const validator = get(info, [ 'definition', 'functions', args.validator ]);
  assert(typeof validator === 'function', 'DirectiveError: @validate ' +
  'requires that the validator argument reference a function in ' +
  'the definition');
  return validator;
}

export default {
  name: 'validate',
  description: 'Validates a field using a custom validator function. ' +
  'For FIELD and FIELD_DEFINITION location the field result will be ' +
  'validated. For INPUT_FIELD_DEFINITION aka arg the argument value' +
  'will be validated. A validator should throw an error if validation ' +
  'fails and return nothing if valid.',
  locations: [
    DirectiveLocation.FIELD,
    DirectiveLocation.FIELD_DEFINITION,
    DirectiveLocation.INPUT_FIELD_DEFINITION
  ],
  args: {
    validator: {
      type: 'String!',
      description: 'Reference to the name of the validator function ' +
      'registered on the SchemaDefinition. Validator function should ' +
      'return a boolean. Returning false will throw a GraphQLError.' +
      'The validator takes a single argument which is the value of ' +
      'The field or argument it is validating.'
    }
  },
  resolve(source, args, context, info) {
    switch (info.location) {
      case DirectiveLocation.ARGUMENT_DEFINITION:
      case DirectiveLocation.INPUT_FIELD_DEFINITION:
        const validator = getValidator(info, args);
        assert(validator(source), 'Validation failed on argument "' +
        info.attachInfo.argName + '" of field "' +
        info.attachInfo.parentField.name + '" of type "' +
        info.attachInfo.parentType.name + '"',
        info.attachInfo.astNode.location);
        break;
      default:
        // when performing no work, omit the trace
        return new GraphQLOmitTraceInstruction();
    }
  },
  resolveResult(source, args, context, info) {
    switch (info.location) {
      case DirectiveLocation.FIELD:
      case DirectiveLocation.FIELD_DEFINITION:
        const validator = getValidator(info, args);
        assert(validator(source), 'Validation failed on field "' +
        info.attachInfo.fieldName + '" of type "' +
        info.attachInfo.parentType.name + '"');
        break;
      default:
        // when performing no work, omit the trace
        return new GraphQLOmitTraceInstruction();
    }
  }
};
