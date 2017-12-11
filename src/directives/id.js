import { GraphQLFactoryDirective } from '../types';
import { DirectiveLocation } from 'graphql';

export default new GraphQLFactoryDirective({
  name: 'id',
  description: 'Identifies the ID field of an object',
  locations: [
    DirectiveLocation.FIELD_DEFINITION
  ]
});
