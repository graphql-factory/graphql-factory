import { set, cloneDeep } from '../jsutils';
import { GraphQLDirective } from 'graphql';
import { getDirectiveValues } from 'graphql/execution/values';

/**
 * Builds an info object for the directive resolver
 * similar to fieldResolveInfo but with directive specific info
 * @param {*} resolveInfo 
 * @param {*} directiveInfo 
 */
export function buildDirectiveInfo(
  resolveInfo,
  directiveInfo
) {
  const {
    parentDirectives,
    peerDirectives,
    location,
    locationNodes,
    directive
  } = directiveInfo;

  // remove the current location from the peers
  const peers = cloneDeep(peerDirectives);
  delete peers[location];

  return {
    location,
    locationNodes,
    directive,
    parentDirectives: cloneDeep(parentDirectives),
    peerDirectives: peers,
    schema: resolveInfo.schema,
    fragments: resolveInfo.fragments,
    rootValue: resolveInfo.rootValue,
    operation: resolveInfo.operation,
    variableValues: resolveInfo.variableValues
  };
}

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
 * Updates a locationInfo object and appends resolver info
 * for request and resolve. The data produced here is used
 * during directive resolver execution to determine what directive
 * resolvers should run with what arguments and info
 * @param {*} astNode 
 * @param {*} location 
 * @param {*} info 
 * @param {*} request 
 * @param {*} result 
 * @param {*} directiveLocations 
 */
export function getDirectiveExec(
  astNode,
  location,
  info,
  request = [],
  result = [],
  directiveLocations = Object.create(null)
) {
  const peerDirectives = Object.create(null);
  const locs = cloneDeep(directiveLocations);
  const resolveReq = [];
  const resolveRes = [];

  astNode.directives.forEach(directiveAST => {
    const dirInfo = getDirective(info, directiveAST.name.value, astNode);
    if (dirInfo) {
      const { name, args, directive } = dirInfo;
      const { locations, resolve, resolveResult } = directive;
      if (locations.indexOf(location) !== -1) {
        set(locs, [ location, name ], args);
        set(peerDirectives, [ location, name ], args);
        if (typeof resolve === 'function') {
          resolveReq.push({
            args,
            location,
            locationNodes: astNode.directives,
            directive,
            resolve
          });
        }
        if (typeof resolveResult === 'function') {
          resolveRes.push({
            args,
            location,
            locationNodes: astNode.directives,
            directive,
            resolve: resolveResult
          });
        }
      }
    }
  });

  // add the directive info after all directives have
  // been added to the locations object
  resolveReq.forEach(req => {
    request.push(Object.assign(
      {
        parentDirectives: cloneDeep(directiveLocations),
        peerDirectives: cloneDeep(peerDirectives)
      },
      req
    ));
  });
  resolveRes.forEach(res => {
    result.push(Object.assign(
      {
        parentDirectives: cloneDeep(directiveLocations),
        peerDirectives: cloneDeep(peerDirectives)
      },
      res
    ));
  });

  return cloneDeep(locs);
}
