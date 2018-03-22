import { FactoryExtension } from './FactoryExtension';
import { pathArray } from '../utilities';

export class FactoryTracingExtension extends FactoryExtension {
  constructor(options) {
    super();
    const { getTime, detailed } = Object.assign({}, options);
    this._getTime = typeof getTime === 'function' ? getTime : Date.now;
    this._detailed = detailed;
    this.data = {
      version: 1,
      startTime: null,
      endTime: null,
      duration: null,
      parsing: null,
      validation: null,
      execution: {
        startTime: null,
        endTime: null,
        duration: null,
        resolvers: [],
      },
    };
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
      duration: -1,
    };
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
      duration: -1,
    };
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
      duration: -1,
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
  resolverStarted(data, info) {
    if (this._detailed) {
      const exec = {
        name: `${info.class === 'directive' ? '@' : ''}${info.name}`,
        location: info.location,
        startTime: this._getTime(),
      };

      if (info.level === 'global') {
        this.data.execution.middleware = this.data.execution.middleware || [];
        this.data.execution.middleware.push(exec);
      } else if (info.level === 'field') {
        data.detailed = data.detailed || [];
        data.detailed.push(exec);
      }
      return exec;
    }
  }
  resolverEnded(data) {
    if (this._detailed) {
      data.endTime = this._getTime();
      data.duration = data.endTime - data.startTime;
    }
  }
}
