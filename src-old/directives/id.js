import { DirectiveLocation } from 'graphql';

export default {
  name: 'id',
  description: 'Identifies the ID field of an object',
  locations: [DirectiveLocation.FIELD_DEFINITION],
};
