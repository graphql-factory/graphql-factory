import { GraphQLDirective } from 'graphql';
import { DirectiveMiddleware } from '../middleware';
import { forEach } from '../utilities';
import { omit } from '../jsutils/lodash.custom';

export class FactoryDirective {
  constructor(config) {
    const directive = new GraphQLDirective(omit(config, ['middleware']));
    directive.middleware = {};
    forEach(config.middleware, (fn, method) => {
      if (DirectiveMiddleware[method] && typeof fn === 'function') {
        directive.middleware[method] = fn;
      }
    });
    return directive;
  }
}
