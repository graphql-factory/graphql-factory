/**
 * A minimal yet feature-rich Promise based http(s) client
 */
import { merge } from '../jsutils';
import http from 'http';
import https from 'https';
import url from 'url';

const Method = {
  GET: 'GET',
  PUT: 'PUT',
  POST: 'POST',
  DELETE: 'DELETE'
};

// default deserializers for result
const deserializers = {
  'application/json': data => {
    return JSON.parse(data);
  }
};

// default serializers for put/post body
const serializers = {
  'application/json': body => {
    return JSON.stringify(body);
  }
};

/**
 * Converts the body value to a string using optional serializers
 * @param {*} opts 
 * @param {*} body 
 */
function processBody(opts, body) {
  if (body === undefined) {
    return '';
  }
  const handlers = Object.assign({}, serializers, opts.serializers);
  const headers = typeof opts.headers === 'object' ? opts.headers : {};
  const contentType = Object.keys(headers).reduce((type, header) => {
    if (typeof type === 'string') {
      return type;
    }
    if (
      header.match(/^content-type$/i) &&
      typeof headers[header] === 'string'
    ) {
      return headers[header].toLowerCase();
    }
    return type;
  }, undefined);

  const handler = handlers[contentType];

  if (typeof handler === 'function') {
    return String(handler(body));
  }
  if (typeof body === 'object') {
    return JSON.stringify(body);
  }
  return String(body);
}

/**
 * Processes the response data based on content type using optional
 * deserializers
 * @param {*} res 
 * @param {*} data 
 * @param {*} options 
 */
function processData(res, data, options) {
  const handlers = Object.assign({}, deserializers, options.deserializers);
  const contentType = res.headers['content-type'];
  const types = typeof contentType === 'string' ? contentType.split(';') : [];

  // if there are no content types, return the data unmodified
  if (!types.length) {
    return data;
  }

  return types.reduce((d, type) => {
    try {
      const t = type.toLocaleLowerCase().trim();
      const handler = handlers[t];

      if (d instanceof Error || typeof handler !== 'function') {
        return d;
      }
      return handler(d);
    } catch (error) {
      return error;
    }
  }, data);
}

/**
 * Main request method to perform an http(s) request
 * @param {*} method 
 * @param {*} address 
 * @param {*} body 
 * @param {*} options 
 */
function request(method, address, body, options) {
  let timeout = null;
  return new Promise((resolve, reject) => {
    try {
      const opts = merge(
        {},
        this.options,
        options,
        url.parse(address),
        { method }
      );

      // handle optional timeout
      if (typeof opts.timeout === 'number') {
        setTimeout(() => {
          reject(new Error(`${method} "${address}" timed out`));
          timeout = null;
        }, Math.floor(opts.timeout));
      }

      // create some request middleware to potentially
      // add headers ahead of time for auth or set cors, etc.
      const before = typeof opts.before === 'function' ?
        opts.before.call(this.context, method, address, opts) :
        () => null;

      const proto = opts.protocol === 'https:' ? https : http;

      return Promise.resolve(before)
        .then(() => {
          clearTimeout(timeout);

          const req = proto.request(opts, res => {
            let data = '';
            res
            .on('data', d => {
              data += d;
            })
            .on('error', error => {
              clearTimeout(timeout);
              reject(error);
            })
            .on('end', () => {
              clearTimeout(timeout);
              const parsedData = processData(res, data, opts);
              return parsedData instanceof Error ?
                reject(parsedData) :
                resolve(parsedData);
            });
          });

          req.on('error', error => {
            clearTimeout(timeout);
            reject(error);
          });

          if (method === Method.PUT || method === Method.POST) {
            req.write(processBody(opts, body));
          }
          req.end();
        })
        .catch(error => {
          clearTimeout(timeout);
          return reject(error);
        });

    } catch (error) {
      clearTimeout(timeout);
      return reject(error);
    }
  });
}

/**
 * Simple HTTP client for making requests
 */
export class HttpClient {
  constructor(options) {
    this.options = options;
    this.context = {};
  }
  get(address, options) {
    return request.call(this, Method.GET, address, null, options);
  }
  put(address, body, options) {
    return request.call(this, Method.PUT, address, body, options);
  }
  post(address, body, options) {
    return request.call(this, Method.POST, address, body, options);
  }
  delete(address, options) {
    return request.call(this, Method.DELETE, address, null, options);
  }
}
