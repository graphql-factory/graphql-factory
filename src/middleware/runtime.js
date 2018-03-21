import {
  isSpecifiedDirective,
  defaultFieldResolver,
  GraphQLError,
} from 'graphql';
import { forEach, isPromise, promiseReduce, isObject } from '../jsutils';
import {
  getDirectiveLocationFromAST,
  getDirectiveByLocation,
} from './directive';

export function extendResolve(resolve, params, extensionMap) {
  const [source, args, context, info] = params;
  const extendedInfo = Object.assign({}, info, {
    fieldArgs: args,
  });
  const extDataMap = extensionMap.resolveStarted(info);
  const beforeMiddleware = [];
  const afterMiddleware = [];

  // TODO: resolve args and input first

  // get any field or field definition middleware
  const nodes = [info.parentType.getFields()[info.fieldName].astNode].concat(
    info.fieldNodes,
  );

  forEach(nodes, node => {
    const location = getDirectiveLocationFromAST(node);
    for (let i = 0; i < node.directives.length; i++) {
      const ast = node.directives[i];
      const directiveInfo = getDirectiveByLocation(
        location,
        node,
        ast,
        info.schema,
        info.variableValues,
      );

      if (directiveInfo) {
        const { before, after, directiveArgs } = directiveInfo;
        if (typeof before === 'function') {
          beforeMiddleware.push({
            type: 'before',
            resolve: before,
            args: directiveArgs,
          });
        }
        if (typeof after === 'function') {
          afterMiddleware.push({
            type: 'after',
            resolve: after,
            args: directiveArgs,
          });
        }
      }
    }
  });

  const resolveQueue = beforeMiddleware
    .concat({ type: 'resolve', resolve, args })
    .concat(afterMiddleware);

  const result = promiseReduce(
    resolveQueue,
    (src, current) => {
      try {
        if (
          current.type === 'resolve' &&
          current.resolve === defaultFieldResolver
        ) {
          if (
            (source && typeof source === 'object') ||
            typeof source === 'function'
          ) {
            const property = source[info.fieldName];
            if (typeof property === 'function') {
              return src === undefined
                ? property(args, context, info)
                : property(src, args, context, info);
            }
            return property;
          }
          return current.resolve(source, args, context, info);
        }
        return current.resolve(src, current.args, context, extendedInfo);
      } catch (err) {
        extensionMap.resolveEnded(extDataMap, err);
        return Promise.reject(err);
      }
    },
    source,
  );

  if (isPromise(result)) {
    return Promise.resolve(result)
      .then(fieldResult => {
        extensionMap.resolveEnded(extDataMap);
        return fieldResult;
      })
      .catch(err => {
        extensionMap.resolveEnded(extDataMap, err);
        return Promise.reject(err);
      });
  }
  extensionMap.resolveEnded(extDataMap);
  return result;
}

export function makeExecutableRuntimeSchema(
  schema,
  runtimeSchema,
  extensionMap,
) {
  const errors = [];
  forEach(runtimeSchema.getTypeMap(), type => {
    if (!type.name || !type.name.match(/^__/)) {
      const master = schema.getType(type.name);
      if (!master) {
        return errors.push(
          new GraphQLError(
            'Could not find type "' + type.name + '" in master schema',
          ),
        );
      }

      if (
        typeof master.getFields === 'function' &&
        typeof type.getFields === 'function'
      ) {
        const fields = master.getFields();
        forEach(type.getFields(), field => {
          const masterField = fields[field.name];
          const masterResolver = isObject(masterField)
            ? masterField.resolve
            : undefined;
          const masterSubscriber = isObject(masterField)
            ? masterField.subscribe
            : undefined;
          field.resolve = (...params) => {
            const resolve =
              typeof masterResolver === 'function'
                ? masterResolver
                : defaultFieldResolver;
            return extendResolve(resolve, params, extensionMap);
          };
          if (typeof masterSubscriber === 'function') {
            field.subscribe = masterSubscriber;
          }
        });
      }
      const fnFields = [
        'serialize',
        'parseValue',
        'parseLiteral',
        'isTypeOf',
        'returnType',
      ];

      fnFields.forEach(n => {
        if (typeof master[n] === 'function') {
          type[n] = master[n];
        }
      });
    }
  });

  forEach(runtimeSchema.getDirectives(), directive => {
    const masterDirective = schema.getDirective(directive.name);
    if (!isSpecifiedDirective(directive) && masterDirective) {
      directive._ext = masterDirective._ext;
    }
  });

  return errors.length
    ? { errors, runtimeSchema: undefined }
    : { errors: undefined, runtimeSchema };
}
