/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found at
 * https://github.com/graphql/graphql-js/blob/master/README.md
 * 
 * Modified for graphql-factory
 * 
 * @flow
 */
import type { ObjMap } from 'graphql/jsutils/ObjMap';
import { GraphQLSkipInstruction } from '../types/instruction';

/**
 * Only returns the value if it acts like a Promise, i.e. has a "then" function,
 * otherwise returns void.
 */
export function getPromise<T>(value: Promise<T> | mixed): Promise<T> | void {
    if (typeof value === 'object' &&
      value !== null &&
      typeof value.then === 'function') {
      return (value: any);
    }
}

/**
 * This function transforms a JS object `ObjMap<Promise<T>>` into
 * a `Promise<ObjMap<T>>`
 *
 * This is akin to bluebird's `Promise.props`, but implemented only using
 * `Promise.all` so it will work with any implementation of ES6 promises.
 */
export function promiseForObject<T>(
  object: ObjMap<Promise<T>>
): Promise<ObjMap<T>> {
  const keys = Object.keys(object);
  const valuesAndPromises = keys.map(name => object[name]);
  return Promise.all(valuesAndPromises)
  .then(values => {
    return values.reduce((resolvedObject, value, i) => {
      if (!(value instanceof GraphQLSkipInstruction)) {
        resolvedObject[keys[i]] = value;
      }
      return resolvedObject;
    }, Object.create(null));
  });
}
