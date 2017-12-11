import { DirectiveLocation } from 'graphql';

export default {
  name: 'context',
  description: 'Merges an object into the context.',
  locations: Object.keys(DirectiveLocation).map(key => DirectiveLocation[key]),
  args: {
    value: {
      type: 'JSON!',
      description: 'Object to merge into the context of the request.'
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
};
