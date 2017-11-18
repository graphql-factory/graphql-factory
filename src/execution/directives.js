/**
 * 
 * @flow
 */
import {
  getDirectiveValues,
  GraphQLSchema,
  GraphQLDirective
} from '../types/graphql';
import type {
  ObjMap,
  DirectiveNode,
  OperationDefinitionNode,
  FieldNode,
  FragmentSpreadNode,
  InlineFragmentNode,
  FragmentDefinitionNode,
  SchemaDefinitionNode,
  ScalarTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  UnionTypeDefinitionNode,
  EnumTypeDefinitionNode,
  EnumValueDefinitionNode,
  InputObjectTypeDefinitionNode,
  DirectiveLocationEnum,
  ExecutionContext
} from '../types/graphql';

import {
  promiseReduce,
  set
} from '../jsutils';

import {
  GraphQLSkipInstruction
} from '../types';

export function getDirectives(
  astNode: { directives?: Array<DirectiveNode>}
): ?Array<DirectiveNode> {
  if (typeof astNode === 'object' &&
    astNode !== null &&
    astNode.hasOwnProperty('directives') &&
    Array.isArray(astNode.directives)) {
      return astNode.directives;
    }
}

export type NodeWithDirectives =
  OperationDefinitionNode |
  FieldNode |
  FragmentSpreadNode |
  InlineFragmentNode |
  FragmentDefinitionNode |
  SchemaDefinitionNode |
  ScalarTypeDefinitionNode |
  ObjectTypeDefinitionNode |
  FieldDefinitionNode |
  InputValueDefinitionNode |
  InterfaceTypeDefinitionNode |
  UnionTypeDefinitionNode |
  EnumTypeDefinitionNode |
  EnumValueDefinitionNode |
  InputObjectTypeDefinitionNode;
// { directives?: ?Array<DirectiveNode> };

export type DirectiveConstraint = {
  location: ?DirectiveLocationEnum;
  astNode: any;
};
export type DirectiveConstraints = Array<DirectiveConstraint>;


// reduces the source directives to a list that can be applied
// along with argument values
export function getDirectiveExec(
  schema: GraphQLSchema,
  constraints: DirectiveConstraints,
  variableValues: ObjMap<mixed>
) {
  // reduce the constraints to a mapping of directive info
  const infoMap = constraints.reduce((info, { astNode, location }) => {
    const directives = astNode &&
    Array.isArray(astNode.directives) ? astNode.directives : [];

    if (!directives.length || !location) {
      return info;
    }

    // analyze each directive and add it if it is allowed
    // on the specified constraint location
    directives.forEach(({ name: { value: directiveName } }) => {
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
        info[directiveName].locations[location] = args;
      } else {
        info[directiveName] = {
          name: directiveName,
          directive,
          locations: {
            [location]: args
          }
        };
      }
    });

    return info;
  }, {});

  // return an array of directive info
  return Object.keys(infoMap).map(directiveName => {
    return infoMap[directiveName];
  });
}

export type DirectiveExec = {
  name: string;
  directive: GraphQLDirective;
  locations: { [location: DirectiveLocationEnum]: any };
};


export type DirectiveTree = {
  parent?: ?DirectiveTree;
  locations?: { [ location: ?string ]: ?mixed };
};

export function reduceLocationTree(
  directiveExec: Array<DirectiveExec>,
  directiveTree?: { [ location: ?string ]: ?mixed }
) {
  return Object.freeze(directiveExec.reduce(
    (locs, { directive, locations }) => {
      const name = directive.name;
      Object.keys(locations).forEach(location => {
        const { args } = locations[location];
        set(locs, [ name, location ], args);
      });
      return locs;
    },
    directiveTree || {}
  ));
}

// reduce the directives at request or result
function reduceDirectives(
  exeContext: ExecutionContext,
  directiveExec: Array<DirectiveExec>,
  resolveType: string,
  scopedSource: any,
  parent: DirectiveTree,
  args?: ?mixed
): Promise<*> {
  return promiseReduce(
    directiveExec,
    (source, { directive, locations }) => {
      if (source instanceof GraphQLSkipInstruction) {
        return source;
      }

      return typeof directive[resolveType] === 'function' ?
        Promise.resolve(
          directive[resolveType](
            source,
            args || {},
            exeContext.contextValue,
            {
              schema: exeContext.schema,
              fragments: exeContext.fragments,
              rootValue: exeContext.rootValue,
              operation: exeContext.operation,
              variableValues: exeContext.variableValues,
              directives: {
                parent: parent.parent,
                locations
              }
            }
          )
        ) :
        source;
    },
    scopedSource
  );
}

// reduces the request directives
export function reduceRequestDirectives(
  exeContext: ExecutionContext,
  directiveExec: Array<DirectiveExec>,
  source: any,
  parent: DirectiveTree,
  args?: ?mixed
): Promise<*> {
  return reduceDirectives(
    exeContext,
    directiveExec,
    'resolveRequest',
    source,
    parent,
    args
  );
}

// reduce the result directives
export function reduceResultDirectives(
  exeContext: ExecutionContext,
  directiveExec: Array<DirectiveExec>,
  source: any,
  parent: DirectiveTree,
  args?: ?mixed
): Promise<*> {
  return reduceDirectives(
    exeContext,
    directiveExec,
    'resolveResult',
    source,
    parent,
    args
  );
}


export type DirectiveContext = {
  directiveExecs: Array<DirectiveExec>;
  directiveTree: DirectiveTree;
  source: ?mixed;
  args: ?mixed;
};

export function wrapWithDirectives(
  exeContext: ExecutionContext,
  definitionContext: DirectiveContext,
  operationContext: DirectiveContext,
  resolve: () => ?mixed,
  skipOnUndefined: boolean
): ?mixed {
  return reduceRequestDirectives(
    exeContext,
    definitionContext.directiveExecs,
    definitionContext.source,
    definitionContext.directiveTree,
    definitionContext.args
  )
  .then(source => {
    return source instanceof GraphQLSkipInstruction ?
      source :
      reduceRequestDirectives(
        exeContext,
        operationContext.directiveExecs,
        source,
        operationContext.directiveTree,
        operationContext.args
      );
  })
  .then(source => {
    return source instanceof GraphQLSkipInstruction ?
      source :
      resolve();
  })
  .then(result => {
    if (result instanceof GraphQLSkipInstruction ||
      (skipOnUndefined && result === undefined)) {
      return new GraphQLSkipInstruction();
    }
    return reduceResultDirectives(
      exeContext,
      definitionContext.directiveExecs,
      result,
      definitionContext.directiveTree,
      definitionContext.args
    )
    .then(directiveResult => {
      // check the directiveResult, if nothing was returned
      // then return the orignal result
      return directiveResult === undefined ?
        result :
        directiveResult;
    });
  })
  .then(result => {
    if (result instanceof GraphQLSkipInstruction) {
      return result;
    }

    return reduceResultDirectives(
      exeContext,
      operationContext.directiveExecs,
      result,
      operationContext.directiveTree,
      operationContext.args
    )
    .then(directiveResult => {
      // check the directiveResult, if nothing was returned
      // then return the orignal result
      return directiveResult === undefined ?
        result :
        directiveResult;
    });
  });
}
