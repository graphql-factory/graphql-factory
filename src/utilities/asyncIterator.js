/**
 * Strategy augmented from graphql-subscriptions
 * https://github.com/graphql/graphql-js/blob/master
 * /src/subscription/__tests__/eventEmitterAsyncIterator.js
 * 
 * Added support for debounce
 */

// from iterall https://github.com/leebyron/iterall/
const SYMBOL_ASYNC_ITERATOR = typeof Symbol === 'function' &&
  Symbol.asyncIterator;
const $$asyncIterator = SYMBOL_ASYNC_ITERATOR || '@@asyncIterator';

function isObject(obj) {
  return typeof obj === 'object' &&
    obj !== null &&
    !Array.isArray(obj);
}

function call(func, ...args) {
  if (typeof func === 'function') {
    return func(...args);
  }
}

class AsyncIterator {
  constructor(values, options) {
    let _values = values;
    let _options = options;

    if (isObject(values)) {
      _options = values;
      _values = [];
    }

    const {
      debounce,
      onThrow,
      onReturn,
      onNext,
      onPush,
      onEnd
    } = isObject(_options) ? _options : {};
    const _this = this;
    this.onPush = onPush;
    this.onEnd = onEnd;
    this.onNext = onNext;
    this.timeout = null;
    this.active = true;
    this.dataQueue = Array.isArray(_values) ? _values.slice() : [];
    this.awaitQueue = [];
    this.debounce = typeof debounce === 'number' && debounce > 0 ?
      debounce :
      null;

    // modify the values array to push new data. this way when
    // data is added to the array it can be queued
    if (Array.isArray(values)) {
      values.length = 0;
      values.push = value => this._push(value);
    }

    // build the iterator
    const iterator = {
      next() {
        return _this.active ? _this._next() : iterator.return();
      },
      return() {
        call(onReturn);
        _this._end();
        return Promise.resolve({ value: undefined, done: true });
      },
      throw(error) {
        call(onThrow, error);
        _this._end();
        return Promise.reject(error);
      },
      [$$asyncIterator]() {
        return iterator;
      }
    };

    // return the pushable iterator object
    return iterator;
  }

  /**
   * Handles a push request with optional debounce
   * @param {*} value 
   */
  _push(value) {
    if (!this.debounce) {
      return this._pushValue(value);
    }

    // if using a debounce, clear the timeout
    // and then set a new one that handles the value
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this._pushValue(value);
    }, this.debounce);
  }

  /**
   * Pushes a value into the queue
   * @param {*} value 
   */
  _pushValue(value) {
    call(this.onPush, value);
    return this.awaitQueue.length ?
      this.awaitQueue.shift()({ value, done: false }) :
      this.dataQueue.push(value);
  }

  /**
   * Gets the next value in the queue as a promise or
   * queues an await resolve
   */
  _next() {
    call(this.onNext);
    return new Promise(resolve => {
      if (this.dataQueue.length) {
        return resolve({
          value: this.dataQueue.shift(),
          done: false
        });
      }
      this.awaitQueue.push(resolve);
    });
  }

  /**
   * Ends the iterator
   */
  _end() {
    if (this.active) {
      this.active = false;
      call(this.onEnd);
      this.awaitQueue.forEach(resolve => {
        resolve({ value: undefined, done: true });
      });
      this.awaitQueue.length = 0;
      this.dataQueue.length = 0;
    }
  }
}

/**
* Default, create iterator from an array
* @param {*} array 
*/
AsyncIterator.fromArray = (array, options) => {
  return new AsyncIterator(array, options);
};

/**
* Create an iterator from a nodejs stream
* @param {*} stream 
* @param {*} options 
*/
AsyncIterator.fromStream = (stream, options) => {
  const array = [];
  const iterator = new AsyncIterator(array, options);
  stream.on('data', value => array.push(value));
  stream.on('close', () => iterator.return());
  return iterator;
};

/**
* Create an iterator from an event emitter
* @param {*} emitter 
* @param {*} event 
* @param {*} options 
*/
AsyncIterator.fromEvent = (emitter, event, options) => {
  const array = [];
  const opts = Object.assign({}, options, {
    onEnd: () => emitter.removeAllListeners(event)
  });
  const iterator = new AsyncIterator(array, opts);
  emitter.on(event, value => array.push(value));
  return iterator;
};

// export the iterator class
export { AsyncIterator };
