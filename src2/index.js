import EventEmitter from 'events'
import Definition from './definition'

class GraphQLFactory extends EventEmitter {
  constructor () {
    super()
    this.definition = new Definition(this)
  }

  use (...args) {
    this.definition.use.apply(this.definition, [ ...args ])
  }
}