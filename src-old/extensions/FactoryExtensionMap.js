import { forEach, reduce, map } from '../utilities';
import { FactoryExtension } from './FactoryExtension';

// same as graphql-extensions for the most part
export class FactoryExtensionMap {
  constructor(extensions, data) {
    this.data = data && typeof data === 'object' ? data : {};
    this.extensions = reduce(extensions, (stack, extension, name) => {
      const ext = typeof extension === 'function'
        ? new extension()
        : extension;
      if (ext instanceof FactoryExtension) {
        stack[name] = ext;
      }
      return stack;
    }, {});
  }
  requestStarted() {
    forEach(this.extensions, ext => ext.requestStarted());
  }
  requestEnded() {
    forEach(this.extensions, ext => ext.requestEnded());
    // compile the extension data into a single object
    reduce(this.extensions, (data, extension, name) => {
      data[name] = extension.data;
      return data;
    }, this.data);
  }
  parsingStarted() {
    forEach(this.extensions, ext => ext.parsingStarted());
  }
  parsingEnded() {
    forEach(this.extensions, ext => ext.parsingEnded());
  }
  validationStarted() {
    forEach(this.extensions, ext => ext.validationStarted());
  }
  validationEnded() {
    forEach(this.extensions, ext => ext.validationEnded());
  }
  resolveStarted(...args) {
    return map(this.extensions, ext => ext.resolveStarted(...args));
  }
  resolveEnded(dataMap, error) {
    Object.keys(this.extensions).forEach((name, i) => {
      const ext = this.extensions[name];
      ext.resolveEnded(dataMap[i], error);
    });
  }
  executionStarted() {
    forEach(this.extensions, ext => ext.executionStarted());
  }
  executionEnded() {
    forEach(this.extensions, ext => ext.executionEnded());
  }
  warning(value) {
    forEach(this.extensions, ext => ext.warning(value));
  }
}
