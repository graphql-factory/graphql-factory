import _ from '../../utils'

export default class SubscriptionManager {
  constructor (options = {}) {
    this.subscriptions = {}
  }

  subscribe (args, resolveContext) {
    let { info, context } = args
    let id = _.get(info, 'operation.name.value')

    // if the subscription is not registered, register it
    if (!_.has(this.subscriptions, `["${id}"]`)) {
      this.subscriptions[id] = {
        schema: info.schema,
        definitions: [info.operation],
        context,
        rootValue: info.rootValue,
        variableValues: info.variableValues
      }

    }
  }

  unsubscribe () {

  }
}