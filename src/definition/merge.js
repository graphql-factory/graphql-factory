import { DEFINITION_FIELDS, EventType, ConflictResolution } from './const';
import { lodash as _, forEach, asrt, stringMatch } from '../jsutils';

/**
 * Merges values
 * @param {*} target 
 * @param {*} source 
 * @param {*} method 
 */
export function mergeValues(target, source, method = 'merge') {
  if (!_.isObjectLike(target)) {
    return _.isObjectLike(source) ? _.cloneDeep(source) : source;
  }
  if (!_.isObjectLike(source)) {
    return source;
  }
  switch (method) {
    case 'assign':
      return Object.assign(target, source);
    default:
      return _.merge(target, source);
  }
}

/**
 * Schema conflicts as unique because their operation fields are
 * only references to a type, so extra care needs to be taken to
 * merge fields between operations and potentially repoint the
 * operation type reference. custom conflict resolution methods
 * can use this method
 * @param {*} def 
 * @param {*} target 
 * @param {*} source 
 */
export function defaultSchemaConflictResolver(definition, target, source) {
  const tgtdef = _.get(definition, [ 'types', target ]);
  const srcdef = _.get(definition, [ 'types', source ]);

  if (!_.isObjectLike(srcdef)) {
    return target;
  }
  if (!_.isObjectLike(tgtdef)) {
    return source;
  }

  forEach(_.get(srcdef, 'fields'), (def, name) => {
    // TODO: add some logic for field conflict merging
    // possibly onConflict for fields
    _.set(tgtdef, [ 'fields', name ], def);
  }, true);

  return target;
}

/**
 * Default conflict resolver
 * @param {*} store 
 * @param {*} name 
 * @param {*} target 
 * @param {*} source 
 */
export function defaultConflictResolver(
  definition,
  store,
  name,
  target,
  source
) {
  switch (store) {
    case 'schema':
      return {
        name,
        value: defaultSchemaConflictResolver(definition, target, source)
      };
    case 'functions':
    case 'context':
      return {
        name,
        value: mergeValues(target, source, 'assign')
      };
    default:
      return {
        name,
        value: mergeValues(target, source)
      };
  }
}

/**
 * Returns a conflict resolution method
 * @param {*} method 
 */
export function getConflictResolver(method) {
  switch (method) {
    // merges object like things together, if source isnt an object
    // then it overwrites the target with the source
    case ConflictResolution.MERGE:
      return (store, name, target, source) => {
        return {
          name,
          value: _.isObjectLike(source) ? _.merge(target, source) : source
        };
      };
    // sets the target value to a clone of the source
    case ConflictResolution.REPLACE:
      return (store, name, target, source) => {
        return {
          name,
          value: _.isObjectLike(source) ? _.cloneDeep(source) : source
        };
      };
    // leaves the target unchanged
    case ConflictResolution.SKIP:
      return (store, name, target) => {
        return { name, value: target };
      };
    // throws an error
    case ConflictResolution.ERROR:
      return (store, name) => {
        return asrt(false, 'merge conflict in ' + store + '.' + name);
      };
    // emits a warning and calls the default conflict resolver
    case ConflictResolution.WARN:
      return (store, name, target, source) => {
        this.emit(EventType.WARN, 'MergeConflict: resolving ' + store +
        ' name conflict for ' + name);
        return defaultConflictResolver(this, store, name, target, source);
      };
    // returns the default conflict resolver
    case ConflictResolution.DEFAULT:
    case undefined:
      return (store, name, target, source) => {
        return defaultConflictResolver(this, store, name, target, source);
      };
    default:
      // if a function is passed, use the function
      if (_.isFunction(method)) {
        return (store, name, target, source) => {
          return method(this, store, name, target, source);
        };
      }

      // anything else is not valid
      asrt('definition', false, 'invalid conflict resolve');
  }
}

/**
 * Determines the conflict resolution and resolves any conflicts
 * @param {*} store 
 * @param {*} target 
 * @param {*} srcValue 
 * @param {*} tgtName 
 */
export function conflictMerge(store, target, srcValue, tgtName) {
  // no conflict: if the target does not have the value add a clone
  if (!_.has(target, [ tgtName ])) {
    _.set(
      target,
      [ tgtName ],
      _.isObjectLike(value) ? _.cloneDeep(value) : value
    );
  }

  // check for the conflict resolution method
  const method = store === 'context' ?
    undefined :
    _.get(value, 'onConflict');
  const onConflict = getConflictResolver.call(
    this,
    method || this._options.onConflict
  );

  // resolve the conflict
  const resolution = onConflict(store, tgtName, target[tgtName], srcValue);
  asrt('definition', _.isObjectLike(resolution), 'conflict resolution ' +
  'did not return a resolution object');
  const { name, value } = resolution;
  asrt('definition', stringMatch(name, true), 'conflict resolution did ' +
  'not return a valid name');
  target[name] = value;
}

/**
 * Merges a definition or definition-like object
 * into the current definition
 * @param {*} definition 
 */
export function mergeDefinition(definition) {
  forEach(DEFINITION_FIELDS, store => {
    const target = this[store];
    const source = definition[store];

    // if the source is not object-like return
    if (!_.isObjectLike(source)) {
      return;
    }

    switch (store) {
      case 'context':
      case 'functions':
      case 'directives':
      case 'types':
      case 'schema':
        if (!_.isObjectLike(target)) {
          this[`_${store}`] = _.merge({}, source);
          return;
        }
        forEach(source, (value, name) => {
          conflictMerge.call(this, store, target, value, name);
        }, true);
        break;
      default:
        break;
    }
  }, true);
  return this;
}
