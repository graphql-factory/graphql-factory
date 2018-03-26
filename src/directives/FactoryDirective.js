import { GraphQLDirective } from 'graphql';
import { DirectiveMiddleware } from '../middleware';
import { forEach } from '../utilities';

export class FactoryDirective {
  constructor(config) {
    const directive = new GraphQLDirective(config);
    directive._ext = {};
    forEach(config.middleware, (fn, method) => {
      if (DirectiveMiddleware[method] && typeof fn === 'function') {
        directive._middleware[method] = fn;
      }
    });
    return directive;
  }
}
