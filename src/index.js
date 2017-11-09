import EventEmitter from 'events'
import Definition from './definition/definition'

export default class GraphQLFactory extends EventEmitter {
  constructor () {
    super()
    this.definition = new Definition(this)
  }

  use (...args) {
    this.definition.use(...args)
  }
}
