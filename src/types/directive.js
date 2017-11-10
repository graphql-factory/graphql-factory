/**
 * Creates a new GraphQLDirective and adds
 * middleware properties to it before returning
 */
import { GraphQLDirective } from 'graphql'
import Middleware from './middleware'
import { MiddlewareTypes } from '../common/const'

const { cast } = Middleware
const TYPES = MiddlewareTypes._values.filter(value => {
  return value !== MiddlewareTypes.RESOLVE
})

export default class GraphQLFactoryDirective {
  constructor (config) {
    // create a directive
    const directive = new GraphQLDirective(config)

    // loop through the types and try to add the directive
    // if it is defined
    for (const type of TYPES) {
      const mw = config[type]
      if (mw) {
        directive[`_${type}`] = cast(type, mw)
      }
    }

    // return the modified directive
    return directive
  }
}
