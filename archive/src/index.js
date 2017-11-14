import EventEmitter from 'events'
import Definition from './definition/definition'

export default class GraphQLFactory extends EventEmitter {
  constructor () {
    super()
    this.definition = new Definition(this)
  }

  use (...args) {
    this.definition.use(...args)
    return this
  }

  beforeBuild (...args) {
    this.definition.beforeBuild(...args)
    return this
  }

  afterBuild (...args) {
    this.definition.afterBuild(...args)
    return this
  }

  build (...args) {
    return this.definition.build(...args)
  }
}
