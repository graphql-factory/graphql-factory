import { describe, it } from 'mocha';
import { expect } from 'chai';
import { HttpClient } from '../http';

const BASE = 'https://jsonplaceholder.typicode.com/posts';

describe('http client test', function () {
  it('tests GET method', function () {
    const client = new HttpClient();
    return client.get(`${BASE}/1`)
      .then(result => {
        expect(typeof result).to.equal('object');
      });
  });

  /*
  it('tests POST method', function () {
    const client = new HttpClient();
    return client.post(BASE, {
      userId: 1
    })
      .then(result => {
        console.log(result)
        expect(typeof result).to.equal('object');
      });
  });
  */
});