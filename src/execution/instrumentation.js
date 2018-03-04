import { lodash as _, getTime } from '../jsutils';
import { GraphQLOmitTraceInstruction } from '../types/instruction';
import { fieldPath } from '../utilities';
import { EventType } from '../definition/const';

/**
 * Safe emitter
 * @param {*} info
 * @param {*} event
 * @param {*} data
 */
function emit(info, event, data) {
  const definition = _.get(info, 'schema.definition');
  if (_.isFunction(definition.emit)) {
    definition.emit(event, data);
  }
}

/**
 * Creates and updates an object that contains run time details for
 * a specific resolver. Also catches any errors
 * @param {*} type
 * @param {*} name
 * @param {*} stack
 * @param {*} resolve
 */
export function instrumentResolver(
  type,
  name,
  resolverName,
  stack,
  info,
  resolver,
  args,
  resolveErrors,
) {
  const parentType =
    _.get(info, 'attachInfo.fieldInfo.parentType') || info.parentType;
  const fieldName =
    _.get(info, 'attachInfo.fieldInfo.fieldName') || info.fieldName;
  const returnType =
    _.get(info, 'attachInfo.fieldInfo.returnType') || info.returnType;

  const execution = {
    type,
    name,
    path: fieldPath(info.attachInfo || info, true),
    location: info.location || null,
    parentType: String(parentType),
    fieldName,
    returnType: String(returnType),
    resolverName,
    start: getTime(),
    end: -1,
    duration: -1,
    error: null,
  };

  const isDefault = resolver.__defaultResolver;

  try {
    return Promise.resolve(resolver(...args))
      .then(
        result => {
          // check for a trace omit instruction
          if (result instanceof GraphQLOmitTraceInstruction) {
            return Promise.resolve(result.source);
          }
          calculateRun(stack, execution, result, isDefault);
          return result;
        },
        err => {
          calculateRun(stack, execution, err, isDefault);
          return resolveErrors ? Promise.resolve(err) : Promise.reject(err);
        },
      )
      .then(result => {
        return _.clone(result);
      });
  } catch (err) {
    emit(info, EventType.ERROR, err);
    calculateRun(stack, execution, err, isDefault);
    return resolveErrors ? Promise.resolve(err) : Promise.reject(err);
  }
}

/**
 * Completes an execution detail and adds it to the run stack
 * @param {*} stack
 * @param {*} execution
 * @param {*} result
 */
export function calculateRun(stack, execution, result, isDefault) {
  execution.end = getTime();
  execution.duration = execution.end - execution.start;
  if (result instanceof Error) {
    const errKeys = Object.getOwnPropertyNames(result);
    execution.error = _.reduce(
      errKeys,
      (errObj, errKey) => {
        return _.set(errObj, [errKey], result[errKey]);
      },
      {},
    );
  }
  // do not trace default resolvers
  if (!isDefault) {
    stack.push(execution);
  }
}
