import { lodash as _, reduce } from '../jsutils';
import {
  getDirectiveValues,
  DirectiveLocation,
  GraphQLDirective,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInputObjectType
} from 'graphql';

/**
 * Gets a directive from the schema as well as its arg values
 * @param {*} info 
 * @param {*} name 
 * @param {*} astNode 
 */
export function getDirective(info, name, astNode) {
  const directive = info.schema.getDirective(name);
  return directive instanceof GraphQLDirective ?
    {
      name,
      args: getDirectiveValues(
        directive,
        astNode,
        info.variableValues
      ),
      directive
    } :
    null;
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
export function buildDirectiveInfo(
  resolveInfo,
  directiveInfo,
  extra
) {
  return _.assign({
    location: directiveInfo.location,
    schema: resolveInfo.schema,
    fragments: resolveInfo.fragments,
    rootValue: resolveInfo.rootValue,
    operation: resolveInfo.operation,
    variableValues: resolveInfo.variableValues,
    definition: resolveInfo.definition
  }, extra);
}

/**
 * Builds an object containing directive resolvers, their
 * locations, and args
 * @param {*} info 
 * @param {*} directiveLocations 
 */
export function getDirectiveResolvers(info, directiveLocations) {
  return reduce(directiveLocations, (res, { location, astNode }) => {
    astNode.directives.forEach(ast => {
      const dirInfo = getDirective(info, ast.name.value, astNode);
      if (dirInfo) {
        const { name, args, directive } = dirInfo;
        const { locations, resolve, resolveResult } = directive;
        if (locations.indexOf(location) !== -1) {
          if (typeof resolve === 'function') {
            res.resolveRequest.push({
              name,
              resolve,
              location,
              args,
              directive,
              astNode,
              ast
            });
          }
          if (typeof resolveResult === 'function') {
            res.resolveResult.push({
              name,
              resolve: resolveResult,
              location,
              args,
              directive,
              astNode,
              ast
            });
          }
        }
      }
    });
    return res;
  }, {
    resolveRequest: [],
    resolveResult: []
  });
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
  extra
) {
  const attachInfo = {
    kind: directiveInfo.astNode.kind,
    path: _.cloneDeep(path || { prev: undefined, key: undefined }),
    astNode: directiveInfo.ast,
    parentType,
    fieldInfo: info || {},
  };
  return _.assign(attachInfo, extra);
}
