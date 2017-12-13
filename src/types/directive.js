/**
 * @flow
 */

 import type {
   DirectiveLocationEnum,
   GraphQLFieldConfigArgumentMap,
   DirectiveDefinitionNode,
   GraphQLFieldResolver
 } from 'graphql';

 import { GraphQLDirective } from 'graphql';
 import { lodash as _ } from '../jsutils';

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
    if (_.isFunction(resolve)) {
      _.set(directive, [ 'resolve' ], resolve);
    }
    if (_.isFunction(resolveResult)) {
      _.set(directive, [ 'resolveResult' ], resolveResult);
    }

    // add hooks
    if (_.isFunction(beforeBuild)) {
      _.set(directive, [ 'beforeBuild' ], beforeBuild);
    }

    // return the modified directive
    return directive;
  }
}
