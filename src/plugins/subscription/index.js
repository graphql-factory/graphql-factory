import _ from '../../utils'
import SubscriptionManager from './SubscriptionManager'

export default class GraphqlFactorySubscriptionPlugin {
  constructor (options) {
    let _self = this

    // create a new subscription manager
    this.manager = new SubscriptionManager(options)

    // add the subscriptionSetup method to the context so that is can be
    // called from the resolve function
    this.context = {
      subscriptionSetup (change, setupHandler, removeHandler) {
        _self.manager.setup(change, setupHandler, removeHandler)
      },
      subscriptionRemove (args) {
        _self.manager.remove(args)
      }
    }
  }

  install (definition) {
    let _self = this

    // install before resolver
    definition.beforeResolve(function (args, next) {
      let { info } = args

      if (_.get(info, 'operation.kind') === this.graphql.Kind.OPERATION_DEFINITION) {
        _self.manager.subscribe(args, this)
      }
      next()
    })
  }
}