import _ from '../../utils'
import SubscriptionManager from './SubscriptionManager'

export default class GraphqlFactorySubscriptionPlugin {
  constructor (options) {
    this.manager = new SubscriptionManager(options)
  }

  install (definition) {
    let _self = this
    definition.beforeResolve(function (args, next) {
      let { info } = args

      if (_.get(info, 'operation.kind') === this.graphql.Kind.OPERATION_DEFINITION) {
        this.manager.subscribe(args, this)
      }
      next()
    })
  }
}