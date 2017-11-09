/**
 * Creates a new GraphQLDirective and adds
 * middleware properties to it before returning
 */
import { GraphQLDirective } from 'graphql'
import Middleware from './middleware'
import {
  BEFORE_MIDDLEWARE,
  AFTER_MIDDLEWARE,
  ERROR_MIDDLEWARE
} from '../common/const'

const TYPES = [
  BEFORE_MIDDLEWARE,
  AFTER_MIDDLEWARE,
  ERROR_MIDDLEWARE
]

export default class GraphQLFactoryDirective {
  constructor (config) {
    const directive = new GraphQLDirective(config)

    // add the middleware types
    TYPES.forEach(type => {
      const mw = config[type]

      directive[`_${type}`] = mw instanceof Middleware
        ? mw
        : typeof mw !== 'function'
          ? undefined
          : new Middleware(type, mw, {
            name: `directive.${type}.${directive.name}`
          })
    })

    return directive
  }
}
