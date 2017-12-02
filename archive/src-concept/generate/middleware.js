import _ from '../common/lodash.custom'
import Middleware from '../definition/middleware'
import {
  ERROR_MIDDLEWARE,
  RESOLVE_MIDDLEWARE,
  EVENT_REQUEST,
  EVENT_WARN,
  EVENT_ERROR
} from '../common/const'

/**
 * Wraps the resolver function in middleware so that it can be
 * added to a middleware queue and processed the same way as
 * other middleware
 * @param resolver
 * @returns {Function}
 */
function resolverMiddleware (resolver) {
  return function (req, res, next) {
    try {
      const { source, args, context, info } = req
      const ctx = { req, res, next }
      const value = resolver.call(ctx, source, args, context, info)

      return Promise.resolve(value)
        .then(result => {
          req.result = result
          return next()
        })
        .catch(next)
    } catch (err) {
      return next(err)
    }
  }
}

/**
 * Processes the next middleware in the queue
 * @param mw
 * @param info
 * @returns {*}
 */
function nextMiddleware (factory, mw, info) {
  const {
    resolved,
    index,
    routes,
    middlewares,
    errorMiddleware,
    req,
    res,
    metrics
  } = info

  const local = {
    finished: false,
    timeout: null
  }

  // check if the request has already been resolved
  if (resolved) return

  // get the current middleware
  const current = mw[index]
  const exec = {
    name: current.functionName,
    started: Date.now(),
    ended: null,
    data: null
  }

  metrics.executions.push(exec)

  // create a next method
  const next = data => {
    clearTimeout(local.timeout)
    if (local.finished || info.resolved) return
    local.finished = true

    // add the result
    exec.ended = Date.now()
    exec.data = data

    // allow reroutes to valid named route paths
    if (_.isString(data)) {
      const route = routes[data]
      if (!route) {
        if (current.type !== ERROR_MIDDLEWARE && errorMiddleware.length) {
          info.index = 0
          req.error = new Error(`No route found for "${data}"`)
          return nextMiddleware(factory, errorMiddleware, info)
        }
        res.end(data)
      }

      // get the correct route set
      const mwSet = route.type === ERROR_MIDDLEWARE
        ? errorMiddleware
        : middlewares

      // increment the re-route counter, set the index and go
      req.reroutes += 1
      info.index = route.index
      return nextMiddleware(factory, mwSet, info)
    }

    // check for an error passed to the next method and not
    // already in the error middleware chain. if condition met
    // start processing error middleware
    if (data instanceof Error) {
      if (current.type !== ERROR_MIDDLEWARE && errorMiddleware.length) {
        info.index = 0
        req.error = data
        return nextMiddleware(factory, errorMiddleware, info)
      }
      res.end(data)
    }

    // check if there is any more middleware in the chain
    // if not, call end to complete the request
   return info.index === mw.length
     ? res.end()
     : nextMiddleware(factory, mw, info)
  }

  // create a timeout for the middleware if timeout > 0
  if (current.timeout > 0) {
    local.timeout = setTimeout(() => {
      local.finished = true
      req.error = new Error(current.functionName
        + ' middleware timed out')

      // add the result
      exec.ended = Date.now()
      exec.data = req.error

      // if already in error middleware and timed out
      // end the entire request, othewise move to error mw
      if (current.type !== ERROR_MIDDLEWARE && errorMiddleware.length) {
        info.index = 0
        return nextMiddleware(factory, errorMiddleware, info)
      }
      return res.end()
    }, current.timeout)
  }

  // try to execute the resolver and if unable
  // move to error middleware. if already in error
  // middleware end the request
  try {
    info.index += 1
    current.resolver(req, res, next)
  } catch (err) {
    clearTimeout(local.timeout)
    local.finished = true
    factory.emit(EVENT_ERROR, err)
    req.error = err

    // add the result
    exec.ended = Date.now()
    exec.data = req.error

    if (current.type !== ERROR_MIDDLEWARE && errorMiddleware.length) {
      info.index = 0
      return nextMiddleware(factory, errorMiddleware, info)
    }
    return res.end()
  }
}

/**
 * process all the middleware
 * @param resolve
 * @param ctx
 * @param params
 * @returns {Promise}
 */
export default function middleware (generator, resolver, req) {
  const { _id, _def } = generator
  const { _before, _after, _error, _factory } = _def
  const requestTimeout = _.get(req, 'context.requestTimeout')

  // create middleware from the resolver with no timeout
  const _resolver = new Middleware(
    RESOLVE_MIDDLEWARE,
    resolverMiddleware(resolver),
    {
      name: 'resolve',
      functionName: resolver.name || 'RESOLVER',
      timeout: _.get(req, 'context.resolverTimeout', 0)
    }
  )

  const middlewares = _before.concat(_resolver).concat(_after)

  // add routes for regular and error middleware
  const routes = {}

  _.forEach(middlewares, (mw, index) => {
    if (mw.name) routes[mw.name] = { type: mw.type, index }
  })
  _.forEach(_error, (mw, index) => {
    if (mw.name) routes[mw.name] = { type: mw.type, index }
  })

  // return a new promise
  return new Promise((resolve, reject) => {
    const local = {
      timeout: null
    }

    // create a response object and track its resolution
    const info = {
      id: _id,
      metrics: {
        started: Date.now(),
        ended: null,
        executions: []
      },
      resolved: false,
      index: 0,
      routes,
      middlewares,
      errorMiddleware: _error,
      req,
      res: Object.freeze({
        end (data) {
          clearTimeout(local.timeout)

          // generate an event data object
          const eventData = _.assign(
            {},
            _.pick(info, [ 'id', 'metrics', 'req' ]),
            { data }
          )

          // check if the request is already resolved
          if (info.resolved) {
            _factory.emit(
              EVENT_WARN,
              eventData,
              'end/send can only be called once'
            )
            return
          }

          // update the info to resolved
          info.resolved = true
          info.metrics.ended = Date.now()

          // emit the request from the factory
          _factory.emit(EVENT_REQUEST, eventData)

          // if the data is an error or there is an error in the request
          // reject the request otherwise resolve with the data or result
          return data instanceof Error || info.req.error instanceof Error
            ? reject(data || info.req.error)
            : resolve(data || info.req.result)
        },
        send (data) {
          if (info.resolved) return
          info.req.error = null
          info.req.result = data
          return info.res.end()
        }
      })
    }

    // create a request timeout if it is set in the request context
    if (_.isNumber(requestTimeout) && requestTimeout > 0) {
      local.timeout = setTimeout(() => {
        if (info.resolved) return
        return info.res.end(new Error('Request timed out'))
      }, Math.floor(requestTimeout))
    }

    // make an initial call to the process the middleware
    return nextMiddleware(_factory, middlewares, info)
  })
}
