import _ from '../common/lodash.custom'
import {
  BEFORE_MIDDLEWARE,
  AFTER_MIDDLEWARE,
  ERROR_MIDDLEWARE
} from '../common/const'

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
      .then(result => {
        return done(undefined, result)
      })
      .catch(done)
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

  // create an end function that can only call done once
  const end = (error, result) => {
    if (resolved) return
    resolved = true
    return done(error, result)
  }

  // create a next function that will be passed to each
  // middleware function. each call to next calls the
  // next middleware in the queue until there are no
  // more. additionally a timeout is created to prevent
  // hanging if the middleware never calls next or
  // takes too long
  const next = (error, result) => {
    clearTimeout(timeout)

    if (type === ERROR_MIDDLEWARE) {
      if (!queue.length) return end(error)
    } else if (error) {
      return end(error)
    } else if (!queue.length) {
      return end(undefined, result)
    }

    // set the current middleware and de-queue it
    const mw = _.first(queue)
    queue = queue.splice(1)

    // create a new timeout
    timeout = setTimeout(() => {
      end(new Error(type + ' middleware timed out'))
    }, mw.timeout)

    // call the resolver method and catch any errors
    try {
      switch (type) {
        case BEFORE_MIDDLEWARE:
          return mw.resolver.call(ctx, params, next)
        case AFTER_MIDDLEWARE:
          return mw.resolver.call(ctx, params, result, next)
        case ERROR_MIDDLEWARE:
          return mw.resolver.call(ctx, params, error, next)
        default:
          return end(new Error('Invalid middleware type "' + type + '"'))
      }
    } catch (err) {
      return end(err)
    }
  }

  // call the first next. if error middleware call
  // the value in the error position
  return type === ERROR_MIDDLEWARE
    ? next(value)
    : next(undefined, value)
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
  processMiddleware(ERROR_MIDDLEWARE, middlewares, ctx, params, error, done)
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
  processMiddleware(AFTER_MIDDLEWARE, middlewares, ctx, params, result, done)
}

/**
 * Processes the before middleware
 * @param mws
 * @param ctx
 * @param params
 * @param done
 */
function beforeMiddleware (middlewares, ctx, params, done) {
  processMiddleware(BEFORE_MIDDLEWARE, middlewares, ctx, params, undefined, done)
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
    // start by processing the before middleware
    return beforeMiddleware(_before, ctx, params, beforeErr => {
      if (beforeErr) {
        return errorMiddleware(_error, ctx, params, beforeErr, bError => {
          return reject(bError)
        })
      }

      // next process the resolver function
      return processResolver(resolver, ctx, params, (resErr, result) => {
        if (resErr) {
          return errorMiddleware(_error, ctx, params, resErr, rError => {
            return reject(rError)
          })
        }

        // finally process the after middleware
        return afterMiddleware(_after, ctx, params, result, (afterErr, finalResult) => {
          if (afterErr) {
            return errorMiddleware(_error, ctx, params, afterErr, aError => {
              return reject(aError)
            })
          }

          // at this point all middleware has been resolved
          return resolve(finalResult)
        })
      })
    })
  })
}
