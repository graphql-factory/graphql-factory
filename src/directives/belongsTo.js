import { DirectiveLocation } from 'graphql';

export default {
  name: 'belongsTo',
  description: 'Identifies a belongsTo relationship/association. See ' +
  'https://github.com/graphql-factory/graphql-factory/wiki/Relations',
  locations: [
    DirectiveLocation.FIELD_DEFINITION
  ],
  args: {
    type: {
      type: 'String!',
      description: 'The name of the parent type for this association'
    },
    on: {
      type: 'String!',
      description: 'The name of the related field on the associated type'
    }
  }
};