import _ from '../../utils'

const DEFAULT_DEBOUNCE = 100 // default debounce in ms
const DEFAULT_PING_TIMEOUT = 5000

export default class SubscriptionManager {
  constructor (options) {
    let { debounce, ping, pingTimeout } = _.isObject(options)
      ? options
      : {}

    // debounce time before re-querying
    this.debounce = _.isNumber(debounce)
      ? Math.floor(debounce)
      : DEFAULT_DEBOUNCE

    // proactively keep connections open only if receiving replies
    this.ping = _.isBoolean(ping)
      ? ping
      : false

    this.pingTimeout = _.isNumber(pingTimeout)
      ? Math.floor(pingTimeout)
      : DEFAULT_PING_TIMEOUT

    this.pingInterval = this.pingTimeout * 2
    this.pingSetup = false
    this.subscriptions = {}
  }

  remove (id) {
    let sub = this.subscriptions[id]
    if (sub.timeout) clearTimeout(sub.timeout)
    if (sub.interval) clearInterval(sub.interval)
    sub.removeHandler(sub.data)
    delete this.subscriptions[id]
  }

  setup (info, setupHandler, removeHandler) {
    let id = _.get(info, 'operation.name.value')
    let sub = this.subscriptions[id]

    // if the sub has been set up, return otherwise mark sub as setup and proceed with setup
    if (sub.setup) return
    sub.setup = true
    sub.removeHandler = removeHandler

    let {
      graphql,
      lib,
      data,
      event,
      schema,
      requestString,
      context,
      rootValue,
      variableValues
    } = sub

    // if ping is enabled
    if (this.ping) {
      // set up an interval to poll for connections
      sub.interval = setInterval(() => {
        // set the subscribers to 0 and send a ping
        sub.subscribers = 0
        lib.emit('subscription ping', event)

        // set a timeout, at the end of the timeout if there are no
        // subscriber pongs, remove the subscription
        sub.timeout = setTimeout(() => {
          if (!sub.subscribers) this.remove(id)
        }, this.pingTimeout)
      }, this.pingInterval)

      // set up the pong response once
      if (!this.pingSetup) {
        this.pingSetup = true
        lib.on('subscription pong', event => {
          sub.subscribers += 1
          if (sub.timeout) {
            clearTimeout(sub.timeout)
            sub.timeout = null
          }
        })
      }
    }

    // run the setup handler with on change method
    setupHandler(() => {
      if (sub.debounce) clearTimeout(sub.debounce)

      // create a debounce so that concurrent changes only send one update
      sub.debounce = setTimeout(() => {
        sub.debounce = null
        graphql(schema, requestString, rootValue, context, variableValues)
          .then(result => {
            lib.emit(event, result)
          }, error => {
            lib.emit(event, {
              errors: [error]
            })
          })
      }, this.debounce)
    }, data)
  }

  subscribe (args, resolveContext) {
    let { info, context } = args
    let id = _.get(info, 'operation.name.value')
    let graphql = resolveContext.graphql

    // if the subscription is not registered, register it
    if (!_.has(this.subscriptions, `["${id}"]`)) {
      this.subscriptions[id] = {
        graphql: graphql.graphql,
        debounce: null,
        lib: resolveContext.lib,
        setup: false,
        subscribers: 1,
        data: {},
        event: id,
        schema: info.schema,
        requestString: graphql.print({
          kind: graphql.Kind.DOCUMENT,
          definitions: [info.operation]
        }),
        context,
        rootValue: info.rootValue,
        variableValues: info.variableValues
      }
    } else {
      this.subscriptions[id].subscribers += 1
    }
  }

  unsubscribe (args) {
    let sub = this.subscriptions[args.id]
    if (!sub) throw new Error('subscription not found')
    sub.subscribers -= 1
    if (sub.subscribers < 1) this.remove(args.id)
  }
}