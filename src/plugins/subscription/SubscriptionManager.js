import _ from '../../utils'

const DEFAULT_DEBOUNCE = 100 // default debounce in ms

export default class SubscriptionManager {
  constructor (options) {
    options = _.isObject(options)
      ? options
      : {}

    this.debounce = _.isNumber(options.debounce)
      ? options
      : DEFAULT_DEBOUNCE

    this.subscriptions = {}
  }

  setup (info, setupHandler) {
    let id = _.get(info, 'operation.name.value')
    let sub = this.subscriptions[id]

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

    // if the sub has been set up, return otherwise mark sub as setup and proceed with setup
    if (sub.setup) return
    sub.setup = true

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
    }
  }

  unsubscribe () {

  }
}