import { DirectiveLocation } from 'graphql';

export default {
  name: 'relation',
  description:
    'Identifies a relationship/association. See ' +
    'https://github.com/graphql-factory/graphql-factory/wiki/Relations',
  locations: [DirectiveLocation.FIELD_DEFINITION],
  args: {
    type: {
      type: 'String!',
      description: 'The name of the parent type for this association.',
    },
    field: {
      type: 'String!',
      description: 'The name of the related field on the parent type.',
    },
    key: {
      type: 'String',
      description:
        'Optional, the data key to look for foreignKey data in. ' +
        'This should only be used if the field name does not match the actual ' +
        'data key.',
    },
  },
};
