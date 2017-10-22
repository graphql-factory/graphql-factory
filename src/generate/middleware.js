export default function middleware (resolver, args, fieldDef) {
  return new Promise((resolve, reject) => {
    const status = {
      resolved: false,
      rejected: false,
      isFulfilled: false
    }

    // create a new resolver context by merging the
    // type context with a new object and the fieldDef
    const ctx = Object.assign({}, this._context, { fieldDef })

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

    // if there is no middleware proceed to the resolver
    if (!this._def._before.length) {
      return processResolver(resolver, args, ctx, doResolve, doReject)
    }

    let hooks = this._def._before.slice()

    // add a timeout to the middleware
    const timeout = setTimeout(() => {
      processResolver(resolver, args, ctx, doResolve, doReject)
    }, this._def._middleware.beforeTimeout)

    const next = error => {
      hooks = hooks.splice(1)
      if (error) {
        clearTimeout(timeout)
        return reject(error)
      } else if (!hooks.length) {
        clearTimeout(timeout)
        return processResolver(resolver, args, ctx, doResolve, doReject)
      }
      return hooks[0].apply(ctx, [ args, next ])
    }
    return hooks[0].apply(ctx, [ args, next ])
  })
}