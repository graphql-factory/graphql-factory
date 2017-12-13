import {
  get,
  forEach,
  union,
  cloneDeep,
  merge,
  isFunction,
  isObject
} from '../jsutils';
import { FactoryEvent } from './definition';
/**
 * Defines the possible actions for type name
 * conflict resolution
 */
export const NameConflictResolution = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  SKIP: 'SKIP',
  OVERWRITE: 'OVERWRITE',
  MERGE: 'MERGE'
};

/**
 * Default conflict resolver for merging root types, context, and overwriting
 * parts of type definitions
 * @param {*} definition 
 * @param {*} name 
 * @param {*} type 
 * @param {*} tgt 
 * @param {*} src 
 */
function defaultConflictResolution(definition, name, type, tgt, src) {
  // TODO: Add support for type/field level conflict settings
  // TODO: Add support for extending types via extend key
  switch(type) {
    case 'type':
      const {
        query,
        mutation,
        subscription
      } = get(definition, [ 'schema' ]) || {};
      // always merge a rootTypes definition
      if ([ query, mutation, subscription].indexOf(name) !== -1) {
        return { name, config: merge(tgt, src) };
      }
      break;
    case 'function':
      return { name, config: Object.assign(tgt, src) };
    case 'context':
      return { name, config: merge(tgt, src) };
    default:
      break;
  }
  // emit a warning
  definition.emit(FactoryEvent.WARN, 'MergeConflict: Duplicate ' + type +
  ' with name "' + name + '" found. Using newer value');
  return { name, config: tgt };
}

/**
 * Handles a type name conflict
 * returns an object containing the type name to use
 * and the type configuration to use. 
 * @param {*} method 
 * @param {*} name 
 * @param {*} prefix 
 */
function handleConflict(definition, method, name, type, tgt, src) {
  const _method = method ?
    method :
    defaultConflictResolution;
  // allow the method to be a function that returns the new name
  // and type configuration
  if (typeof _method === 'function') {
    return _method(definition, name, type, tgt, src);
  }

  switch (_method) {
    // merges the target and source configurations
    case NameConflictResolution.MERGE:
      return { name, config: merge(tgt, src) };

    // throws an error
    case NameConflictResolution.ERROR:
      throw new Error('Duplicate ' + type + ' name "' + name +
      '" is not allowed ' + 'when conflict is set to ' +
      NameConflictResolution.ERROR);

    // prints a warning and then overwrites the existing type definition
    case NameConflictResolution.WARN:
      definition.emit(FactoryEvent.WARN, 'GraphQLFactoryWarning: duplicate ' +
      'type name "' + name + '" found. Merging ' + type +
      ' configuration')
      return { name, config: merge(tgt, src) };

    // ignores the definition
    case NameConflictResolution.SKIP:
      return { name, config: tgt };

    // silently overwrites the value
    case NameConflictResolution.OVERWRITE:
      return { name, config: src };

    default:
      throw new Error('Invalid name conflict resolution');
  }
}

export function mergeSchema(definition, source) {
  const { conflict } = definition._options;
  const defSchema = definition._config.schema || Object.create(null);
  const srcSchema = source.schema;

  const { directives } = defSchema;

  forEach(srcSchema, (cfg, name) => {
    switch (name) {
      case 'directives':
        defSchema.directives = Array.isArray(directives) ?
          Array.isArray(cfg) ? union(directives, cfg) : directives :
          Array.isArray(cfg) ? cfg : directives;
        break;
      case 'query':
      case 'mutation':
      case 'subscription':
        const defRootType = definition._config.types[defSchema[name]];
        const srcRootType = source.types[cfg];
        if (!srcRootType) {
          throw new Error('Source query operation rootType "' +
            srcRootType + '" not found');
        }

        if (!defRootType) {
          defSchema[name] = cfg;
          break;
        }
        mergeWithConflicts(
          definition,
          defRootType.fields,
          srcRootType.fields,
          conflict,
          'field'
        );
        break;
      case '@directives':
        defSchema[name] = mergeWithConflicts(
          definition,
          defSchema[name],
          srcSchema[name],
          conflict,
          'directives'
        );
        break;
      default:
        break;
    }
  }, true);

  return defSchema;
}

/**
 * generic merge method with conflict resolution
 * @param {*} target 
 * @param {*} source 
 * @param {*} conflict 
 * @param {*} type 
 */
export function mergeWithConflicts(
  definition,
  target,
  source,
  conflict,
  type
) {
  if (!target) {
    return cloneDeep(source);
  } else if (!source) {

    return target;
  }

  forEach(source, (value, key) => {
    if (target[key]) {
      const { name, config } = handleConflict(
        definition,
        conflict,
        key,
        type,
        target[key],
        value
      );
      target[name] = cloneDeep(config);
    } else {
      target[key] = isFunction(value) ?
        value :
        isObject(value) ?
          cloneDeep(value) :
          value;
    }
  }, true);

  return target;
}
