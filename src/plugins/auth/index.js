import { GraphQLFactoryPlugin } from '../plugin';
import { DirectiveLocation } from 'graphql';
/**
 * Plugin for authentication and authorization
 * 
 * Strategy modeled after graphcool permission queries
 * 
 * This plugin will create a separate schema that it will
 * inject into each request. Directives will take advantage of
 * this schema to perform authN and authZ
 * 
 * It will provide 2 directives, one for authentication and
 * one for authorization.
 * 
 * Authentication directive should be provided an authenticate
 * resolver and return a valid userid on successful authentication
 * and null or errors if not authenticated
 * 
 * Authorization
 * 1. verify the user is valid
 * 2. operation
 *    a. query
 *       1. perform query
 *       2. run sift on results in 
 */

const example = `
type Foo @permission(filter: { id: userID, role: { $in: ['ADMIN'] } }) {

}

`

export class GraphQLFactoryAuthPlugin extends GraphQLFactoryPlugin {
  constructor() {
    super();
    this.context = {};
    this.directives = {
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
  }

  install(definition) {

  }
};
