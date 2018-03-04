/**
 * @flow
 */
import type {
  DirectiveLocationEnum,
  GraphQLFieldConfigArgumentMap,
  DirectiveDefinitionNode,
  GraphQLFieldResolver,
} from 'graphql';

import { GraphQLDirective } from 'graphql';
import { lodash as _ } from '../jsutils';

export type GraphQLFactoryDirectiveConfig = {
  name: string,
  description?: ?string,
  locations: Array<DirectiveLocationEnum>,
  args?: ?GraphQLFieldConfigArgumentMap,
  astNode?: ?DirectiveDefinitionNode,
  before?: ?GraphQLFieldResolver<*, *>,
  after?: ?GraphQLFieldResolver<*, *>,
  build?: () => ?mixed,
};

export class GraphQLFactoryDirective {
  constructor(config: GraphQLFactoryDirectiveConfig) {
    const {
      name,
      description,
      locations,
      args,
      astNode,
      before,
      after,
      build,
    } = config;

    // create a directive
    const directive = new GraphQLDirective({
      name,
      description,
      locations,
      args,
      astNode,
    });

    if (_.isFunction(before)) {
      _.set(directive, 'before', before);
    }
    if (_.isFunction(after)) {
      _.set(directive, 'after', after);
    }
    if (_.isFunction(build)) {
      _.set(directive, 'build', build);
    }

    // return the modified directive
    return directive;
  }
}
