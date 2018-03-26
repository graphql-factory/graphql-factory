import { DirectiveLocation, GraphQLError } from 'graphql';
import { FactoryDirective } from './FactoryDirective';
import { get } from '../jsutils/lodash.custom';

export const SubscribeDirective = new FactoryDirective({
  name: 'subscribe',
  description:
    'Defines what function from the function store should be used as the field subscriber',
  locations: [DirectiveLocation.FIELD_DEFINITION],
  args: {
    name: {
      type: 'String!',
      description: 'Name of the function to use',
    },
  },
  middleware: {
    visitFieldDefinition(field, args, { schema, directive }) {
      const func = get(schema, ['definition', 'functions', args.name]);
      if (typeof func !== 'function') {
        throw new GraphQLError(
          '@' +
            directive.name +
            ' directive could not find subscriber function ' +
            args.name +
            ' in the function store',
        );
      }
      field.subscribe = func;
    },
  },
});
