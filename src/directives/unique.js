import { DirectiveLocation } from 'graphql';

export default {
  name: 'unique',
  description: 'Marks a field as unique',
  locations: [DirectiveLocation.FIELD_DEFINITION],
};
