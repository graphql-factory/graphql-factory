import {
  lodash as _,
  reduce,
  promiseReduce,
  mapMaybePromise
} from '../jsutils';
import {
  ExecutionType,
  instrumentResolver,
  traceDirective,
} from './instrumentation';
import {
  getDirectiveValues,
  DirectiveLocation,
  GraphQLDirective,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInputObjectType,
} from 'graphql';
import { addPath } from 'graphql/execution/execute';

/**
 * Gets a directive from the schema as well as its arg values
 * @param {*} info
 * @param {*} name
 * @param {*} astNode
 */
export function getDirective(info, name, astNode) {
  const directive = info.schema.getDirective(name);
  if (directive instanceof GraphQLDirective) {
    const args = getDirectiveValues(directive, astNode, info.variableValues);
    return { name, args, directive };
  }
}

/**
 * Get the object type location
 * @param {*} object
 */
export function objectTypeLocation(object) {
  if (object instanceof GraphQLObjectType) {
    return DirectiveLocation.OBJECT;
  } else if (object instanceof GraphQLScalarType) {
    return DirectiveLocation.SCALAR;
  } else if (object instanceof GraphQLInterfaceType) {
    return DirectiveLocation.INTERFACE;
  } else if (object instanceof GraphQLUnionType) {
    return DirectiveLocation.UNION;
  } else if (object instanceof GraphQLEnumType) {
    return DirectiveLocation.ENUM;
  } else if (object instanceof GraphQLInputObjectType) {
    return DirectiveLocation.INPUT_OBJECT;
  }
  throw new Error('No object type location could be found');
}

/**
 * Builds an info object for the directive resolver
 * similar to fieldResolveInfo but with directive specific info
 * @param {*} resolveInfo
 * @param {*} directiveInfo
 */
export function buildDirectiveInfo(resolveInfo, directiveInfo, extra) {
  return _.assign(
    {
      location: directiveInfo.location,
      schema: resolveInfo.schema,
      fragments: resolveInfo.fragments,
      rootValue: resolveInfo.rootValue,
      operation: resolveInfo.operation,
      variableValues: resolveInfo.variableValues,
      definition: resolveInfo.definition,
    },
    extra,
  );
}

/**
 * Builds an object containing directive resolvers, their
 * locations, args, etc
 * @param {*} info
 * @param {*} directiveLocations
 */
export function getDirectiveContext(
  exeContext,
  directiveLocations,
  tracing,
  prev,
) {
  return reduce(
    directiveLocations,
    (res, values) => {
      const { location, astNode, parentType } = values;
      astNode.directives.forEach(ast => {
        const dirInfo = getDirective(exeContext, ast.name.value, astNode);
        if (dirInfo) {
          const { name, args, directive } = dirInfo;
          const { locations, before, after } = directive;
          const info = {
            location,
            parentType,
            path: addPath(prev, `@${name}`),
          };
          if (locations.indexOf(location) !== -1) {
            if (_.isFunction(before)) {
              res.resolveBefore.push({
                name,
                resolve: traceDirective(before, tracing, info),
                location,
                args,
                directive,
                astNode,
                ast,
                info,
              });
            }
            if (_.isFunction(after)) {
              res.resolveAfter.push({
                name,
                resolve: traceDirective(after, tracing, info),
                location,
                args,
                directive,
                astNode,
                ast,
                info,
              });
            }
          }
        }
      });
      return res;
    },
    { resolveBefore: [], resolveAfter: [] },
    true,
  );
}

export function execArgDirectives(exeContext, fieldDef, fieldNodes, info) {
  const args = getArgumentValues(
    fieldDef,
    fieldNodes[0],
    exeContext.variableValues,
  );

  // if there are no arguments, return the empty object
  if (_.isEmpty(args)) {
    return args;
  }

  return mapMaybePromise(args, (arg, key) => {
    
  })
  .then(() => args);

}

/**
 * Creates attachInfo which will be added on to directive info
 * @param {*} directiveInfo
 * @param {*} path
 * @param {*} parentType
 * @param {*} info
 * @param {*} extra
 */
export function buildAttachInfo(
  directiveInfo,
  path,
  parentType,
  info,
  selection,
  extra,
) {
  const key = selection.name.value;
  const field = _.isFunction(parentType.getFields)
    ? _.get(parentType.getFields(), [key])
    : null;

  const attachInfo = {
    kind: directiveInfo.astNode.kind,
    path: _.cloneDeep(path || { prev: undefined, key: undefined }),
    astNode: directiveInfo.ast,
    parentType,
    fieldInfo: Object.assign({}, info, {
      fieldName: key,
      returnType: field.type,
      parentType,
    }),
  };
  return _.assign(attachInfo, extra);
}

/**
 * Reduces the request directives overwritting the source value
 * if a value is returned from the directive resolver
 * @param {*} value
 * @param {*} resolveRequest
 * @param {*} context
 * @param {*} attachInfo
 * @param {*} info
 */
export function reduceRequestDirectives(
  value,
  resolveBefore,
  context,
  info,
  parentType,
  path,
  selection,
) {
  const execution = info.operation._factory.execution;
  if (!_.isArray(resolveBefore) || !resolveBefore.length) {
    return Promise.resolve(value);
  }
  return promiseReduce(
    resolveBefore,
    (prev, r) => {
      const attachInfo = buildAttachInfo(r, path, parentType, info, selection);
      const directiveInfo = buildDirectiveInfo(info, r, { attachInfo });
      return instrumentResolver(
        ExecutionType.DIRECTIVE,
        r.directive.name,
        r.resolve.name || 'resolve',
        execution.execution.resolvers,
        directiveInfo,
        r.resolve,
        [prev, r.args, context, directiveInfo],
      ).then(directiveResult => {
        return directiveResult === undefined ? prev : directiveResult;
      });
    },
    value,
  );
}
