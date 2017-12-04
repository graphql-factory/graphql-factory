/**
 * @flow
 */

 import type {
   DirectiveLocationEnum,
   GraphQLFieldConfigArgumentMap,
   DirectiveDefinitionNode,
   GraphQLFieldResolver
 } from 'graphql';

 import {
   GraphQLDirective
 } from 'graphql';
 import { set } from '../jsutils'

export type GraphQLFactoryDirectiveConfig = {
  name: string;
  description?: ?string;
  locations: Array<DirectiveLocationEnum>;
  args?: ?GraphQLFieldConfigArgumentMap;
  astNode?: ?DirectiveDefinitionNode;
  resolve?: ?GraphQLFieldResolver<*, *>;
  resolveResult?: ?GraphQLFieldResolver<*, *>;
  beforeBuild?: () => ?mixed;
};

export class GraphQLFactoryDirective {
  constructor(config: GraphQLFactoryDirectiveConfig) {
    const {
      name,
      description,
      locations,
      args,
      astNode,
      resolve,
      resolveResult,
      beforeBuild
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
    if (typeof resolve === 'function') {
      set(directive, [ 'resolve' ], resolve);
    }
    if (typeof resolveResult === 'function') {
      set(directive, [ 'resolveResult' ], resolveResult);
    }

    // add hooks
    if (typeof beforeBuild === 'function') {
      set(directive, [ 'beforeBuild' ], beforeBuild)
    }

    // return the modified directive
    return directive;
  }
}
