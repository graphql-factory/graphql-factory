/**
 * Generate an execution plan from selections and 
 * info that is consumable by execute. this is to map
 * out all of the actions asynchronously before performing
 * any field/directive resolution which will expand fragments
 * 
 * Plans as structured as trees
 */
import { lodash as _, forEach } from '../jsutils';
import { getDirectiveResolvers } from './directives';
import { DirectiveLocation, Kind } from 'graphql';
import { getOperationLocation } from '../utilities';

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
              directive
            });
          }
          if (typeof resolveResult === 'function') {
            res.resolveResult.push({
              name,
              resolve: resolveResult,
              location,
              args,
              directive
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

export function planFields(info, selectionSet) {
  const fields = [];

}

/**
 * Plans an entire operation execution
 * @param {*} info 
 */
export function planExecution(info) {
  // initial directive info
  const planASTs = [
    {
      location: DirectiveLocation.SCHEMA,
      astNode: info.schema.astNode
    },
    {
      location: getOperationLocation(info),
      astNode: info.operation
    }
  ];

  // add each fragment ast to the processLocations queue
  forEach(info.fragments, astNode => {
    if (astNode.kind === Kind.FRAGMENT_DEFINITION) {
      planASTs.push({
        location: DirectiveLocation.FRAGMENT_DEFINITION,
        astNode
      });
    }
  });

  // return the planned directives and fields
  return Object.assign(
    {
      serial: info.operation.operation === 'mutation',
      fields: planFields(info, info.operation.selectionSet) || []
    },
    getDirectiveResolvers(info, planASTs)
  );
}
