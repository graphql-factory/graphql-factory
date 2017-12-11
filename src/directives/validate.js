import { get } from '../jsutils';
import { DirectiveLocation } from 'graphql';
import {
  GraphQLFactoryDirective,
  GraphQLOmitTraceInstruction
} from '../types';

function getValidator(info, args) {
  const validator = get(
    info,
    [ 'definition', 'functions', args.validator ]
  );
  if (typeof validator !== 'function') {
    throw new Error('DirectiveError: @validate requires that the ' +
    'validator argument reference a function in the definition');
  }
  return validator;
}

export default new GraphQLFactoryDirective({
  name: 'validate',
  description: 'Validates a field using a custom validator function. ' +
  'For FIELD and FIELD_DEFINITION location the field result will be ' +
  'validated. For INPUT_FIELD_DEFINITION aka arg the argument value' +
  'will be validated. A validator should throw an error if validation ' +
  'fails and return nothing if valid.',
  locations: [
    DirectiveLocation.FIELD,
    DirectiveLocation.FIELD_DEFINITION
    DirectiveLocation.INPUT_FIELD_DEFINITION
  ],
  args: {
    validator: {
      type: 'String!'
    }
  },
  resolve(source, args, context, info) {
    switch (info.location) {
      case DirectiveLocation.INPUT_FIELD_DEFINITION:
        const validator = getValidator(info, args);
      default:
        return new GraphQLOmitTraceInstruction();
    }
  },
  resolveResult(source, args, context, info) {
    switch (info.location) {
      case DirectiveLocation.FIELD:
      case DirectiveLocation.FIELD_DEFINITION:
        const validator = getValidator(info, args);
      default:
        return new GraphQLOmitTraceInstruction();
    }
  }
});
