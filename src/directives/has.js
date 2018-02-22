import { DirectiveLocation } from 'graphql';

export default {
  name: 'has',
  description: 'Identifies a has relationship/association. See ' +
  'https://github.com/graphql-factory/graphql-factory/wiki/Relations',
  locations: [
    DirectiveLocation.FIELD_DEFINITION
  ],
  args: {
    on: {
      type: 'String!',
      description: 'The name of the field in the associated type who\'s ' +
      'value is stored in the current type\'s dataset';
    }
  }
};