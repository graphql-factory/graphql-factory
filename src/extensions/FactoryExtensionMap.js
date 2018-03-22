import _ from 'lodash';
import { FactoryExtension } from './FactoryExtension';

// same as graphql-extensions for the most part
export class FactoryExtensionMap {
  constructor(extensions, data) {
    this.data = _.isObject(data) ? data : {};
    this.extensions = _.reduce(
      extensions,
      (stack, extension, name) => {
        const ext = _.isFunction(extension) ? new extension() : extension;
        if (ext instanceof FactoryExtension) {
          stack[name] = ext;
        }
        return stack;
      },
      {},
    );
  }
  requestStarted() {
    _.forEach(this.extensions, ext => ext.requestStarted());
  }
  requestEnded() {
    _.forEach(this.extensions, ext => ext.requestEnded());
    // compile the extension data into a single object
    _.reduce(
      this.extensions,
      (data, extension, name) => {
        data[name] = extension.data;
        return data;
      },
      this.data,
    );
  }
  parsingStarted() {
    _.forEach(this.extensions, ext => ext.parsingStarted());
  }
  parsingEnded() {
    _.forEach(this.extensions, ext => ext.parsingEnded());
  }
  validationStarted() {
    _.forEach(this.extensions, ext => ext.validationStarted());
  }
  validationEnded() {
    _.forEach(this.extensions, ext => ext.validationEnded());
  }
  resolveStarted(...args) {
    return _.map(this.extensions, ext => ext.resolveStarted(...args));
  }
  resolveEnded(dataMap, error) {
    Object.keys(this.extensions).forEach((name, i) => {
      const ext = this.extensions[name];
      ext.resolveEnded(dataMap[i], error);
    });
  }
  resolverStarted(dataMap, resolverInfo) {
    return Object.keys(this.extensions).map((name, i) => {
      const ext = this.extensions[name];
      return ext.resolverStarted(
        dataMap && typeof dataMap === 'object' ? dataMap[i] : dataMap,
        resolverInfo,
      );
    });
  }
  resolverEnded(dataMap) {
    Object.keys(this.extensions).forEach((name, i) => {
      const ext = this.extensions[name];
      ext.resolverEnded(dataMap[i]);
    });
  }
  executionStarted() {
    _.forEach(this.extensions, ext => ext.executionStarted());
  }
  executionEnded() {
    _.forEach(this.extensions, ext => ext.executionEnded());
  }
  warning(value) {
    _.forEach(this.extensions, ext => ext.warning(value));
  }
}
