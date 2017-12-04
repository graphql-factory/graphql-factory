import {
  forEach,
  union,
  cloneDeep,
  merge
} from '../jsutils';
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
 * Handles a type name conflict
 * returns an object containing the type name to use
 * and the type configuration to use. 
 * @param {*} method 
 * @param {*} name 
 * @param {*} prefix 
 */
function handleConflict(method, name, type, tgt, src) {
  // allow the method to be a function that returns the new name
  // and type configuration
  if (typeof method === 'function') {
    return method(name, type, tgt, src);
  }

  const _method = method ?
    method :
    NameConflictResolution.MERGE;
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
      /* eslint-disable */
      console.warn('\x1b[33m%s\x1b[0m', 'GraphQLFactoryWarning: duplicate ' +
        'type name "' + name + '" found. Merging ' + type +
        ' configuration');
      /* eslint-enable */
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
          defRootType.fields,
          srcRootType.fields,
          conflict,
          'field'
        );
        break;
      case '@directives':
        defSchema[name] = mergeWithConflicts(
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
export function mergeWithConflicts(target, source, conflict, type) {
  if (!target) {
    return cloneDeep(source);
  } else if (!source) {
    return target;
  }

  forEach(source, (value, key) => {
    if (target[key]) {
      const { name, config } = handleConflict(
        conflict,
        key,
        type,
        target[key],
        value
      );
      target[name] = cloneDeep(config);
    } else {
      target[key] = cloneDeep(value);
    }
  }, true);

  return target;
}
