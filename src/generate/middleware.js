import _ from 'lodash'

/**
 * Processes the resolver function
 * @param resolver
 * @param ctx
 * @param params
 * @param done
 * @returns {*}
 */
function processResolver (resolver, ctx, params, done) {
  try {
    const { source, args, context, info } = params
    const value = resolver.call(ctx, source, args, context, info)

    return Promise.resolve(value)
      .then(result => done(undefined, result), done)
  } catch (err) {
    return done(err)
  }
}

/**
 * Generic middleware processing function
 * @param type
 * @param middlewares
 * @param ctx
 * @param params
 * @param value
 * @param done
 */
function processMiddleware (type, middlewares, ctx, params, value, done) {
  let timeout = null
  let queue = middlewares.slice()
  let resolved = false

  // create a done function that catches calls to done
  // after it has already been resolved
  let _done = error => {
    if (resolved) return
    resolved = true
    return done(error)
  }

  const next = (error, newValue) => {
    clearTimeout(timeout)
    if (error) return _done(error)
    else if (!queue.length) return _done(undefined, newValue)

    // set the current middleware and de-queue it
    const mw = _.first(queue)
    queue = queue.splice(1)

    // create a new timeout
    timeout = setTimeout(() => {
      _done(new Error(type + ' middleware timed out'))
    }, mw.timeout)

    // call the resolver method and catch any errors
    try {
      return type === 'before'
        ? mw.resolver.call(ctx, params, next)
        : mw.resolver.call(ctx, params, newValue, next)
    } catch (err) {
      return _done(err)
    }
  }

  // call the first next
  next(undefined, value)
}

/**
 * Processes the error middleware
 * @param mws
 * @param ctx
 * @param params
 * @param error
 * @param done
 */
function errorMiddleware (middlewares, ctx, params, error, done) {
  processMiddleware('error', middlewares, ctx, params, error, done)
}

/**
 * Processes the after middleware
 * @param mws
 * @param ctx
 * @param params
 * @param result
 * @param done
 */
function afterMiddleware (middlewares, ctx, params, result, done) {
  processMiddleware('after', middlewares, ctx, params, result, done)
}

/**
 * Processes the before middleware
 * @param mws
 * @param ctx
 * @param params
 * @param done
 */
function beforeMiddleware (middlewares, ctx, params, done) {
  processMiddleware('before', middlewares, ctx, params, undefined, done)
}

/**
 * process all the middleware
 * @param resolve
 * @param ctx
 * @param params
 * @returns {Promise}
 */
export default function middleware (definition, resolver, ctx, params) {
  const { _before, _after, _error } = definition

  return new Promise((resolve, reject) => {
    const status = {
      resolved: false,
      rejected: false,
      isFulfilled: false
    }

    // create a reject handler so that reject is only called once
    const doReject = error => {
      if (status.isFulfilled) return
      status.isFulfilled = true
      status.rejected = true
      reject(error)
    }

    // create a resolve handler so that resolve is only called once
    const doResolve = result => {
      if (status.isFulfilled) return
      status.isFulfilled = true
      status.resolved = true
      resolve(result)
    }

    // start by processing the before middleware
    return beforeMiddleware(_before, ctx, params, beforeErr => {
      if (beforeErr) {
        return errorMiddleware(_error, ctx, params, beforeErr, bError => {
          return doReject(bError)
        })
      }

      // next process the resolver function
      return processResolver(resolver, ctx, params, (resErr, result) => {
        if (resErr) {
          return errorMiddleware(_error, ctx, params, resErr, rError => {
            return doReject(rError)
          })
        }

        // finally process the after middleware
        return afterMiddleware(_after, ctx, params, result, (afterErr, finalResult) => {
          if (afterErr) {
            return errorMiddleware(_error, ctx, params, afterErr, aError => {
              return doReject(aError)
            })
          }

          // at this point all middleware has been resolved
          return doResolve(finalResult)
        })
      })
    })
  })
}