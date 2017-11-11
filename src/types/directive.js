/**
 * Creates a new GraphQLDirective and adds
 * middleware properties to it before returning
 */
import _ from '../common/lodash.custom'
import Middleware from '../types/middleware'
import { GraphQLDirective, DirectiveLocation } from 'graphql'
import { Lifecycle, DirectiveConflict } from '../common/const'

const ALL_LOCATIONS = _.values(DirectiveLocation)

// all possible directive locations deconstructed
const {
  // operations
  QUERY,
  MUTATION,
  SUBSCRIPTION,
  FIELD,
  FRAGMENT_DEFINITION,
  FRAGMENT_SPREAD,
  INLINE_FRAGMENT,
  // definitions
  SCHEMA,
  SCALAR,
  OBJECT,
  FIELD_DEFINITION,
  ARGUMENT_DEFINITION,
  INTERFACE,
  UNION,
  ENUM,
  ENUM_VALUE,
  INPUT_OBJECT,
  INPUT_FIELD_DEFINITION
} = DirectiveLocation

const OPERATION_LOCATIONS = [
  QUERY,
  MUTATION,
  SUBSCRIPTION,
  FIELD,
  FRAGMENT_DEFINITION,
  FRAGMENT_SPREAD,
  INLINE_FRAGMENT
]

const REQUEST_LOCATIONS = [
  SCHEMA,
  SCALAR,
  OBJECT,
  INTERFACE,
  UNION,
  ENUM,
  INPUT_OBJECT
].concat(OPERATION_LOCATIONS)

const RESOLVE_LOCATIONS = [
  FIELD,
  FRAGMENT_DEFINITION,
  FRAGMENT_SPREAD,
  INLINE_FRAGMENT,
  FIELD_DEFINITION,
  ARGUMENT_DEFINITION,
  ENUM_VALUE,
  INPUT_FIELD_DEFINITION
]

/**
 * scopes the allowed middleware based on the directive locations
 * @type {*}
 */
const LifecycleMap = {
  [Lifecycle.BEFORE_REQUEST]: REQUEST_LOCATIONS,
  [Lifecycle.AFTER_REQUEST]: REQUEST_LOCATIONS,
  [Lifecycle.REQUEST_ERROR]: ALL_LOCATIONS,
  [Lifecycle.BEFORE_RESOLVE]: RESOLVE_LOCATIONS,
  [Lifecycle.RESOLVE]: [],
  [Lifecycle.AFTER_RESOLVE]: RESOLVE_LOCATIONS,
  [Lifecycle.BEFORE_QUERY]: RESOLVE_LOCATIONS.concat(QUERY),
  [Lifecycle.AFTER_QUERY]: RESOLVE_LOCATIONS.concat(QUERY),
  [Lifecycle.BEFORE_MUTATION]: RESOLVE_LOCATIONS.concat(MUTATION),
  [Lifecycle.AFTER_MUTATION]: RESOLVE_LOCATIONS.concat(MUTATION),
  [Lifecycle.BEFORE_SUBSCRIPTION]: RESOLVE_LOCATIONS.concat(SUBSCRIPTION),
  [Lifecycle.SUBSCRIPTION_START]: RESOLVE_LOCATIONS.concat(SUBSCRIPTION),
  [Lifecycle.SUBSCRIPTION_DATA]: RESOLVE_LOCATIONS.concat(SUBSCRIPTION),
  [Lifecycle.SUBSCRIPTION_END]: RESOLVE_LOCATIONS.concat(SUBSCRIPTION)
}

export default class GraphQLFactoryDirective {
  constructor (config) {
    // create a directive
    const directive = new GraphQLDirective(config)
    const { locations, conflict: _conflict } = config
    const conflict = _conflict || DirectiveConflict.OPERATION
    let error = null

    // create a _factory key which will act as a backing
    directive._factory = { conflict }

    // validate the conflict value
    if (!DirectiveConflict.hasValue(conflict)) {
      throw new Error('Invalid Directive conflict value "'
        + conflict + '"')
    }

    // look for lifecycle middleware, validate
    // and add to the backing
    _.forEach(config, (value, key) => {
      try {
        if (!_.has(LifecycleMap, [ key ])) return true
        const allowedLocations = LifecycleMap[key]

        // check the allowed locations
        if (!_.intersection(allowedLocations, locations).length) {
          throw new Error('DirectiveError: ' + key
            + ' lifecycle requires one of the following directive '
            + 'locations [' + allowedLocations.join(', ') + ']')
        }

        // attempt to set the value as middleware
        directive._factory[key] = Middleware.cast(key, value, {
          name: `directive.${directive.name}.${key}`
        })
      } catch (err) {
        error = err
        return false
      }
    })

    // check for error and throw
    if (error) throw error

    // return the modified directive
    return directive
  }
}
