import AsyncIterator from './asyncIterator';

/**
 * Handles the subscription
 */
export class Subscription {
  constructor(resolver, args, context, info, options) {
    this.clients = Object.create(null);
    this.metadata = Object.create(null);
    this.resolver = resolver;
    this.args = args;
    this.context = context;
    this.info = info;
    this.options = options;

    // the subscribe handler simply looks for changes it cares about
    // which signals that its time to perform the query
    resolver.subscribeHandler(change => {
      // perform the graphql request again and push the results
      // to each iterator


      Object.keys(this.clients).forEach(client => {
        Object.keys(this.clients[client]).forEach(op => {
          this.clients[client][op].push(change);
        });
      });
    }, this.metadata);
  }

  /**
   * Adds a subscriber to the subscription
   * @param {*} clientID 
   * @param {*} operationName 
   */
  subscribe(clientID, operationName) {
    this.clients[clientID] = this.clients[clientID] || Object.create(null);
    if (!this.clients[clientID][operationName]) {
      this.clients[clientID][operationName] =
        new AsyncIterator(this.options);
    }

    // return a new async iterator
    return this.clients[clientID][operationName].iterator;
  }

  /**
   * Removes a subscriber from the subscription
   * @param {*} clientID 
   * @param {*} operationName 
   */
  unsubscribe(clientID, operationName) {
    // check for the subscription
    if (!this.clients[clientID] || !this.clients[clientID][operationName]) {
      return this;
    }

    // remove the event listeners and clean up the operation
    this.clients[clientID][operationName].iterator.return();
    delete this.clients[clientID][operationName];

    // if the client has no more subscriptions, clean up the client
    if (!Object.keys(this.clients[clientID]).length) {
      delete this.clients[clientID];
    }

    return this;
  }

  /**
   * Gets a list of subscribers
   */
  subscribers() {
    return Object.keys(this.clients);
  }
}
