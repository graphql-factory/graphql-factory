import * as _ from '../jsutils/lodash.custom';
import http from 'http';
import https from 'https';
import url from 'url';
import AsyncIterator from '../types/asyncIterator';
import { forAwaitEach } from 'iterall';

export function httpPOST(uri, body, options) {
  const timeout = null;
  return new Promise((resolve, reject) => {
    try {
      // create the options
      const opts = _.merge({}, options, url.parse(uri), { method: 'POST' });

      // determine the protocol to use
      const proto = opts.protocol === 'https:' ? https : http;

      // set a timeout
      if (_.isNumber(opts.timeout)) {
        setTimeout(() => {
          reject(new Error(`POST ${uri} timed out`));
        }, Math.floor(opts.timeout));
      }

      // create the request
      const req = proto.request(opts, res => {
        let data = '';
        const contentType = res.headers['content-type'];
        const types =
          typeof contentType === 'string'
            ? contentType.split(';').map(h => h.trim().toLowerCase())
            : [];

        const iterator = AsyncIterator.fromStream(res, {
          closeEvent: 'end',
        });

        // iterate through the data stream
        return forAwaitEach(iterator, value => {
          data += value;
        })
          .then(() => {
            clearTimeout(timeout);
            if (types.indexOf('application/json') !== -1) {
              try {
                resolve(JSON.parse(data));
              } catch (parseErr) {
                clearTimeout(timeout);
                return reject(parseErr);
              }
            }
          })
          .catch(err => {
            clearTimeout(timeout);
            return reject(err);
          });
      });

      // monitor errors
      req.on('error', error => {
        clearTimeout(timeout);
        reject(error);
      });

      // convert the body to string
      const bodyStr = _.isObject(body) ? JSON.stringify(body) : String(body);

      // make request
      req.write(bodyStr);
      req.end();
    } catch (err) {
      clearTimeout(timeout);
      return reject(err);
    }
  });
}
