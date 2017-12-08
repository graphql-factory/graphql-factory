import { get } from '../jsutils';
import assert from 'assert';

/**
 * Default client id handler checks args then context
 * then rootValue for a clientID field to use
 * @param {*} args 
 * @param {*} context 
 * @param {*} info 
 */
function defaultClientIDHandler(args, context, info) {
  return get(args, [ 'clientID' ]) ||
    get(context, [ 'clientID' ]) ||
    get(info, [ 'rootValue', 'clientID' ]);
}

/**
 * Base subscription resolver class
 */
export class SubscriptionResolver {
  constructor(manager) {
    this._manager = manager;
    this.clientIDHandler = defaultClientIDHandler;
  }

  /**
   * function to get the client id from the resolve function
   * @param {*} handler 
   */
  clientID(handler) {
    if (typeof handler !== 'function') {
      throw new Error('SubscriptionError: clientID handler ' +
      'must be a function');
    }
    this.clientIDHandler = handler;
    return this;
  }
}

/**
 * Returned by a field resolve function to instruct
 * a subscription on how to set itself up and perform
 * its query
 */
export class SubscribeResolver extends SubscriptionResolver {
  constructor(manager) {
    super(manager);
    this.subscribeHandler = null;
    this.unsubscribeHandler = null;
    this.queryHandler = null;
  }

  /**
   * Provides the handler for setting up a new subscription
   * @param {*} handler 
   */
  subscribe(handler) {
    if (typeof handler !== 'function') {
      throw new Error('SubscriptionError: subscribe handler ' +
      'must be a function');
    }
    this.subscribeHandler = handler;
    return this;
  }

  /**
   * Provides the handler for unsubscribing a subscription
   * @param {*} handler 
   */
  unsubscribe(handler) {
    if (typeof handler !== 'function') {
      throw new Error('SubscriptionError: unsubscribe handler ' +
      'must be a function');
    }
    this.unsubscribeHandler = handler;
    return this;
  }

  /**
   * Provides the handler for performing a query
   * @param {*} handler 
   */
  query(handler) {
    if (typeof handler !== 'function') {
      throw new Error('SubscriptionError: query handler ' +
      'must be a function');
    }
    this.queryHandler = handler;
    return this;
  }

  /**
   * Returns a field resolver function
   */
  resolve(...rargs) {
    const [ , args, context, info ] = rargs;

    // first check that all fields have been set
    assert(
      typeof this.subscribeHandler === 'function',
      'SubscriptionResolverError: subscribe handler is not a function'
    );
    assert(
      typeof this.unsubscribeHandler === 'function',
      'SubscriptionResolverError: unsubscribe handler is not a function'
    );
    assert(
      typeof this.queryHandler === 'function',
      'SubscriptionResolverError: query handler is not a function'
    );
    assert(
      typeof this.clientIDHandler === 'function',
      'SubscriptionResolverError: clientID handler is not a function'
    );

    // then get the client id
    const clientID = this.clientIDHandler(args, context, info);
    const subscriptionID = info.operation.name.value;

    // assert a client id value is string or number
    assert(
      (typeof clientID === 'string' || typeof clientID === 'number') &&
      clientID !== '',
      'SubscriptionResolverError: clientID is invalid or was not ' +
      'provided'
    );

    // if the subscription exists, call the query handler
    // otherwise call the subscribe method that returns an async iterator
    return this._manager.getSubscription(clientID, subscriptionID) ?
      this.queryHandler() :
      this._manager.subscribe(this, clientID, rargs);
  }
}

/**
 * Creates an unsubscribe resolver
 */
export class UnsubscribeResolver extends SubscriptionResolver {
  constructor(manager) {
    super();
    this._manager = manager;
  }

  /**
   * Returns a resolver function that is able to unsubscribe
   * @param {*} rargs 
   */
  resolve(...rargs) {
    const [ , args, context, info ] = rargs;

    assert(
      typeof this.clientIDHandler === 'function',
      'SubscriptionResolverError: clientID handler is not a function'
    );

    // then get the client id
    const clientID = this.clientIDHandler(args, context, info);
    const subscriptionID = get(info, [ 'operation', 'name', 'value' ]);

    // assert a client id value is string or number
    assert(
      (typeof clientID === 'string' || typeof clientID === 'number') &&
      clientID !== '',
      'SubscriptionResolverError: clientID is invalid or was not ' +
      'provided'
    );

    // assert a client id value is string or number
    assert(
      (typeof subscriptionID === 'string') && subscriptionID !== '',
      'SubscriptionResolverError: subscriptionID is invalid or was not ' +
      'provided'
    );

    // call unsubscribe on the manager
    return this._manager.unsubscribe(clientID, subscriptionID);
  }
}
