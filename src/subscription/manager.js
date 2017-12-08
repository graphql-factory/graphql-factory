/**
 * The subscription manager keeps a mapping of subscriptions to
 * clientID and operation names. This means that when a client
 * requests a subscription with a specific operation name, that
 * operation name will be used as the subscription id for that client
 * while on the backend the actual subscription id is a uuidv4.
 * 
 * Subscriptions structure is
 * 
 * const subscriptions = {
 *   ['subscriptionUUIDv4']: Subscription
 * }
 */
import crypto from 'crypto';
import { SubscribeResolver, UnsubscribeResolver } from './resolver';

export function uuidv4() {
  return ( [ 1e7 ] + -1e3 + -4e3 + -8e3 + -1e11 )
    .replace(/[018]/g, c => {
      return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4)
        .toString(16);
    });
}

/**
 * Manages subscriptions
 */
export class SubscriptionManager {
  constructor() {
    this.broadcastHandler = null;
    this.subscriptions = Object.create(null);
  }

  broadcast(handler) {
    this.broadcastHandler = handler;
  }

  // looks up a subscription by client and name
  getSubscription(clientID, operationName) {
    for (const id of Object.keys(this.subscriptions)) {
      for (const client of Object.keys(this.subscriptions[id])) {
        for (const opName of Object.keys(this.subscriptions[id][client])) {
          if (clientID === client && operationName === opName) {
            return this.subscriptions[id];
          }
        }
      }
    }
  }

  subscribe(
    resolver,
    clientID,
    rargs
  ) {
    // TODO: remove this
    return { resolver, clientID, rargs };
  }

  unsubscribe() {

  }

  /**
   * Creates a new Subscribe resolver
   */
  SubscribeResolver() {
    return new SubscribeResolver(this);
  }

  /**
   * Creates a new Unsubscribe resolver
   */
  UnsubscribeResolver() {
    return new UnsubscribeResolver(this);
  }
}
