import { DirectiveLocation } from 'graphql';

const validTypes = [ 'boolean', 'number', 'string' ];

export default {
  name: 'enum',
  description: 'Sets the value of an ENUM before the schema is built. ' +
  'This is useful when the value of the ENUM does not match the name',
  locations: [ DirectiveLocation.ENUM_VALUE ],
  args: {
    value: {
      type: 'JSON!',
      description: 'The ENUM value to use'
    }
  },
  beforeBuild(source, args) {
    const valueType = typeof args.value;
    if (validTypes.indexOf(valueType) === -1) {
      throw new Error('Only types Boolean, Int, Float, ' +
      'and String are allowed as ENUM values, got "' +
      valueType + '"');
    }
    source.value = args.value;
  }
};
