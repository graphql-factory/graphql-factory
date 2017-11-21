/**
 * @flow
 */

 import type {
   DirectiveLocationEnum,
   GraphQLFieldConfigArgumentMap,
   DirectiveDefinitionNode,
   GraphQLFieldResolver
 } from './graphql.js';

 import {
   GraphQLDirective
 } from './graphql';

export type GraphQLFactoryDirectiveConfig = {
  name: string;
  description?: ?string;
  locations: Array<DirectiveLocationEnum>;
  args?: ?GraphQLFieldConfigArgumentMap;
  astNode?: ?DirectiveDefinitionNode;
  resolveRequest?: ?GraphQLFieldResolver;
  resolveResult?: ?GraphQLFieldResolver;
};

export class GraphQLFactoryDirective {
  constructor(config: GraphQLFactoryDirectiveConfig) {
    const {
      name,
      description,
      locations,
      args,
      astNode,
      resolveRequest,
      resolveResult
    } = config;

    // create a directive
    const directive = new GraphQLDirective({
      name,
      description,
      locations,
      args,
      astNode
    });

    // add resolvers
    if (typeof resolveRequest === 'function') {
      directive.resolveRequest = resolveRequest;
    }
    if (typeof resolveResult === 'function') {
      directive.resolveResult = resolveResult;
    }

    // return the modified directive
    return directive;
  }
}
