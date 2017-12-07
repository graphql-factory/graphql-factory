/**
 * Strategy augmented from graphql-subscriptions
 * https://github.com/graphql/graphql-js/blob/master
 * /src/subscription/__tests__/eventEmitterAsyncIterator.js
 * 
 * Added support for debounce
 */
import { $$asyncIterator } from 'iterall';
export const DATA_EVENT = 'data';

function isObject(obj) {
  return typeof obj === 'object' &&
    obj !== null &&
    !Array.isArray(obj);
}

function isString(str) {
  return typeof str === 'string' && str !== '';
}

class AsyncIterator {
  constructor(values, options) {
    let _values = values;
    let _options = options;

    if (isObject(values)) {
      _options = values;
      _values = [];
    }

    const { debounce } = isObject(_options) ? _options : {};
    const _this = this;
    this.timeout = null;
    this.active = true;
    this.dataQueue = Array.isArray(_values) ? _values : [];
    this.awaitQueue = [];
    this.event = DATA_EVENT;
    this.debounce = typeof debounce === 'number' && debounce > 0 ?
      debounce :
      null;

    // build the iterator
    const iterator = {
      next() {
        return _this.active ? _this._next() : iterator.return();
      },
      return() {
        _this._end();
        return Promise.resolve({ value: undefined, done: true });
      },
      throw(error) {
        _this._end();
        return Promise.reject(error);
      },
      [$$asyncIterator]() {
        return iterator;
      }
    }

    // return the pushable iterator object
    return {
      iterator,
      push: value => {
        return this._push(value)
      }
    };
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
    return this.awaitQueue.length ?
      this.awaitQueue.shift()({ value, done: false }) :
      this.dataQueue.push(value);
  }

  /**
   * Gets the next value in the queue as a promise or
   * queues an await resolve
   */
  _next() {
    return new Promise(resolve => {
      if (this.dataQueue.length) {
        return resolve({
          value: this.dataQueue.shift(),
          done: false
        });
      }
      this.awaitQueue.push(resolve);
    })
  }

  /**
   * Ends the iterator
   */
  _end() {
    if (this.active) {
      this.active = false;
      this.awaitQueue.forEach(resolve => {
        resolve({ value: undefined, done: true });
      })
      this.awaitQueue.length = 0;
      this.dataQueue.length = 0;
    }
  }
}

AsyncIterator.fromArray = (array) => {
  const iterator = new AsyncIterator(array);
  return iterator.iterator;
}

AsyncIterator.fromStream = (stream, options) => {
  const iterator = new AsyncIterator([], options);
  stream.on('data', value => {
    iterator.push(value);
  })
  return iterator.iterator;
}

AsyncIterator.fromEvent = (emitter, event, options) => {
  const iterator = new AsyncIterator([], options);
  emitter.on(event, value => {
    iterator.push(value);
  })
  return iterator.iterator;
}


export default AsyncIterator