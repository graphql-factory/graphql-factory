import { DirectiveLocation } from 'graphql';

export default {
  name: 'meta',
  description: 'Attaches generic metadata to a location.',
  locations: Object.keys(DirectiveLocation).map(key => DirectiveLocation[key]),
  args: {
    data: {
      type: 'JSON!',
      description: 'Metadata to make available to the resolver.',
    },
  },
};
