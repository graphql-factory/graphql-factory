import { DirectiveLocation } from 'graphql';

export const directives = {
  authenticate: {
    description: 'Provides authentication to a graphql schema',
    locations: [
      DirectiveLocation.FIELD_DEFINITION
    ],
    args: {
      strategy: 'String!'
    },
    resolve(source, args, context, info) {

    }
  },
  authorize: {
    description: 'Provides authorization to a graphql schema',
    locations: [
      DirectiveLocation.SCHEMA,
      DirectiveLocation.OBJECT,
      DirectiveLocation.SCALAR,
      DirectiveLocation.ENUM,
      DirectiveLocation.INPUT_OBJECT,
      DirectiveLocation.INTERFACE,
      DirectiveLocation.UNION,
      DirectiveLocation.FIELD_DEFINITION,
    ],
    args: {
      query: 'String!'
    },
    resolve(source, args, context, info) {

    }
  }
};
