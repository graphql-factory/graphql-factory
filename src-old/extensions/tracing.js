import { FactoryExtension } from './FactoryExtension';

export class FactoryTracingExtension extends FactoryExtension {
  constructor(options) {
    super();
    const { getTime } = Object.assign({}, options);
    this._getTime = typeof getTime === 'function' ? getTime : Date.now;
    this.data = {
      version: 1,
      startTime: -1,
      endTime: -1,
      duration: -1,
      execution: {
        startTime: -1,
        endTime: -1,
        duration: -1,
        resolvers: []
      }
    }
  }
  requestStarted() {
    this.data.startTime = this._getTime();
  }
  requestEnded() {
    this.data.endTime = this._getTime();
    this.data.duration = this.data.endTime - this.data.startTime;
  }
  parsingStarted() {
    this.data.parsing = {
      startTime: this._getTime(),
      endTime: -1,
      duration: -1
    }
  }
  parsingEnded() {
    const parsing = this.data.parsing;
    parsing.endTime = this._getTime();
    parsing.duration = parsing.endTime - parsing.startTime;
  }
  validationStarted() {
    this.data.validation = {
      startTime: this._getTime(),
      endTime: -1,
      duration: -1
    }
  }
  validationEnded() {
    const validation = this.data.validation;
    validation.endTime = this._getTime();
    validation.duration = validation.endTime - validation.startTime;
  }
  executionStarted() {
    this.data.execution.startTime = this._getTime();
  }
  executionEnded() {
    const execution = this.data.execution;
    execution.endTime = this._getTime();
    execution.duration = execution.endTime - execution.startTime;
  }
  resolveStarted(info) {
    const exec = {
      path: pathArray(info.path),
      fieldName: info.fieldName,
      parentType: info.parentType,
      returnType: info.returnTypes,
      startTime: this._getTime(),
      endTime: -1,
      duration: -1
    };
    this.data.execution.resolvers.push(exec);
    return exec;
  }
  resolveEnded(data, error) {
    data.endTime = this._getTime();
    data.duration = data.endTime - data.startTime;
    if (error) {
      data.error = error;
    }
  }
}
