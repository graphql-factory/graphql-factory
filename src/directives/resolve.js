import { DirectiveLocation, GraphQLError } from 'graphql';
import { FactoryDirective } from './FactoryDirective';
import { get } from '../jsutils/lodash.custom';

export const ResolveDirective = new FactoryDirective({
  name: 'resolve',
  description:
    'Defines what function from the function store should be used as the field resolver',
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
            ' directive could not find resolver function ' +
            args.name +
            ' in the function store',
        );
      }
      field.resolve = func;
    },
  },
});
