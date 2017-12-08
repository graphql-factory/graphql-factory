import { GraphQLFactoryDirective } from '../types';
import { DirectiveLocation } from 'graphql';

export default new GraphQLFactoryDirective({
  name: 'context',
  description: 'Merges an object into the context',
  locations: [
    DirectiveLocation.FIELD,
    DirectiveLocation.FIELD_DEFINITION
  ],
  args: {
    value: {
      type: 'JSON!'
    }
  },
  resolve(source, args, context) {
    if (
      typeof args.value !== 'object' ||
      args.value === null ||
      Array.isArray(args.value)
    ) {
      throw new Error('@context directive requires value ' +
      'to be a non-array object');
    }
    Object.assign(context, args.value);
  }
});
