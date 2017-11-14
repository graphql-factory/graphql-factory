// @flow
import promiseReduce from '../jsutils/promiseReduce'
import { getDirectiveValues } from 'graphql'
import { buildResolveInfo } from './request'

// reduces the source directives to a list that can be applied
// along with argument values
export function getDirectiveExec (schema, constraints, variableValues) {
  // reduce the constraints to a mapping of directive info
  const infoMap = constraints.reduce((info, { astNode, location }) => {
    if (!astNode) return info;

    // analyze each directive and add it if it is allowed
    // on the specified constraint location
    astNode.directives.forEach(({ name: { value: directiveName } }) => {
      // get the directive by name
      const directive = schema
        ._directives
        .reduce((foundDirective, directiveDef) => {
          return foundDirective || directiveDef.name !== directiveName ?
            foundDirective :
            directiveDef;
        }, null);

      // validate that the directive is allowed on the schema
      if (!directive || directive.locations.indexOf(location) === -1) {
        return;
      }

      // get the args
      const args = getDirectiveValues(directive, astNode, variableValues);

      // add the location and args if the directive exists in the map
      if (info[directiveName]) {
        info[directiveName].locations[location] = {
          args,
          fieldNodes: [ astNode ]
        };
      } else {
        info[directiveName] = {
          name: directiveName,
          directive,
          locations: {
            [location]: {
              args,
              fieldNodes: [ astNode ]
            }
          }
        };
      }
    })

    return info
  }, {})

  // return an array of directive info
  return Object.keys(infoMap).map(directiveName => {
    return infoMap[directiveName]
  })
}

// reduce the directives at request or result
function reduceDirectives (
  exeContext,
  directiveExec,
  resolveType,
  scopedSource
) {
  const info = buildResolveInfo(
    exeContext,
    { type: undefined },
    [ { name: { value: undefined } } ],
    undefined,
    { prev: undefined, key: undefined }
  )

  return promiseReduce(
    directiveExec,
    (source, { directive, locations }) => {
      return typeof directive[resolveType] === 'function' ?
        Promise.resolve(
          directive[resolveType](
            source,
            locations,
            exeContext.contextValue,
            info
          )
        ) :
        source;
    },
    scopedSource
  )
}

// reduces the request directives
export function reduceRequestDirectives (exeContext, directiveExec, source) {
  return reduceDirectives(
    exeContext,
    directiveExec,
    'resolveRequest',
    source
  )
}

// reduce the result directives
export function reduceResultDirectives (exeContext, directiveExec, source) {
  return reduceDirectives(
    exeContext,
    directiveExec,
    'resolveResult',
    source
  )
}