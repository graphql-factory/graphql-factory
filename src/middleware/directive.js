import { DirectiveLocation, Kind, getDirectiveValues } from 'graphql';
import { isArray } from '../jsutils';

export const DirectiveMiddleware = Object.freeze({
  visitQueryNode: 'visitQueryNode',
  beforeQuery: 'beforeQuery',
  afterQuery: 'afterQuery',

  visitMutationNode: 'visitMutationNode',
  beforeMutation: 'beforeMutation',
  afterMutation: 'afterMutation',

  visitSubscriptionNode: 'visitSubscriptionNode',
  beforeSubscription: 'beforeSubscription',
  afterSubscription: 'afterSubscription',

  visitFieldNode: 'visitFieldNode',
  beforeField: 'beforeField',
  afterField: 'afterField',

  visitFragmentDefinitionNode: 'visitFragmentDefinitionNode',
  visitFragmentSpreadNode: 'visitFragmentSpreadNode',
  visitInlineFragmentNode: 'visitInlineFragmentNode',

  visitSchema: 'visitSchema',
  visitSchemaNode: 'visitSchemaNode',
  beforeSchema: 'beforeSchema',
  afterSchema: 'afterSchema',

  visitScalar: 'visitScalar',
  visitScalarNode: 'visitScalarNode',

  visitObject: 'visitObject',
  visitObjectNode: 'visitObjectNode',

  visitFieldDefinition: 'visitFieldDefinition',
  visitFieldDefinitionNode: 'visitFieldDefinitionNode',
  beforeFieldDefinition: 'beforeFieldDefinition',
  afterFieldDefinition: 'afterFieldDefinition',

  visitArgumentDefinition: 'visitArgumentDefinition',
  visitArgumentDefinitionNode: 'visitArgumentDefinitionNode',

  visitInterface: 'visitInterface',
  visitInterfaceNode: 'visitInterfaceNode',

  visitUnion: 'visitUnion',
  visitUnionNode: 'visitUnionNode',

  visitEnum: 'visitEnum',
  visitEnumNode: 'visitEnumNode',

  visitEnumValue: 'visitEnumValue',
  visitEnumValueNode: 'visitEnumValueNode',

  visitInputObject: 'visitInputObject',
  visitInputObjectNode: 'visitInputObjectNode',

  visitInputFieldDefinition: 'visitInputFieldDefinition',
  visitInputFieldDefinitionNode: 'visitInputFieldDefinitionNode',
});

export function camel(str) {
  return str
    .split('_')
    .map((v, i) => {
      return i === 0
        ? v.toLowerCase()
        : v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
    })
    .join('');
}

export function getDirectiveExecByLocation(
  location,
  node,
  ast,
  schema,
  variableValues,
) {
  const directive = schema.getDirective(ast.name.value);
  if (directive && directive.middleware) {
    const visitNode = directive.middleware[camel(`VISIT_${location}_NODE`)];
    const visitDef = directive.middleware[camel(`VISIT_${location}`)];
    const before = directive.middleware[camel(`BEFORE_${location}`)];
    const after = directive.middleware[camel(`AFTER_${location}`)];
    const directiveArgs = getDirectiveValues(directive, node, variableValues);
    return {
      visit: visitDef,
      visitNode,
      before,
      after,
      directiveArgs,
      directive,
      location,
    };
  }
}

export function getDirectiveLocationFromAST(node, ancestors) {
  switch (node.kind) {
    // Request Definitions
    case Kind.OPERATION_DEFINITION:
      switch (node.operation) {
        case 'query':
          return DirectiveLocation.QUERY;
        case 'mutation':
          return DirectiveLocation.MUTATION;
        case 'subscription':
          return DirectiveLocation.SUBSCRIPTION;
        default:
          throw new Error(
            'Invalid operation type "' + node.operation + '" found in AST',
          );
      }
    case Kind.FIELD:
      return DirectiveLocation.FIELD;
    case Kind.FRAGMENT_DEFINITION:
      return DirectiveLocation.FIELD_DEFINITION;
    case Kind.FRAGMENT_SPREAD:
      return DirectiveLocation.FRAGMENT_SPREAD;
    case Kind.INLINE_FRAGMENT:
      return DirectiveLocation.INLINE_FRAGMENT;
    // Type System Definitions
    case Kind.SCHEMA_DEFINITION:
      return DirectiveLocation.SCHEMA;
    case Kind.SCALAR_TYPE_DEFINITION:
      return DirectiveLocation.SCALAR;
    case Kind.OBJECT_TYPE_DEFINITION:
      return DirectiveLocation.OBJECT;
    case Kind.FIELD_DEFINITION:
      return DirectiveLocation.FIELD_DEFINITION;
    case Kind.INPUT_VALUE_DEFINITION:
      return ancestors &&
        ancestors.length &&
        ancestors[ancestors.length - 1].kind === Kind.FIELD_DEFINITION
        ? DirectiveLocation.ARGUMENT_DEFINITION
        : DirectiveLocation.INPUT_FIELD_DEFINITION;
    case Kind.INTERFACE_TYPE_DEFINITION:
      return DirectiveLocation.INTERFACE;
    case Kind.UNION_TYPE_DEFINITION:
      return DirectiveLocation.UNION;
    case Kind.ENUM_TYPE_DEFINITION:
      return DirectiveLocation.ENUM;
    case Kind.ENUM_VALUE_DEFINITION:
      return DirectiveLocation.ENUM_VALUE;
    case Kind.INPUT_OBJECT_TYPE_DEFINITION:
      return DirectiveLocation.INPUT_OBJECT;
    default:
      break;
  }
}

export function forEachDirective(
  location,
  node,
  schema,
  variableValues,
  iteratee,
) {
  if (isArray(node, 'directives', 1)) {
    // look at each directive attached to the location
    for (let i = 0; i < node.directives.length; i++) {
      const ast = node.directives[i];
      const directiveExec = getDirectiveExecByLocation(
        location,
        node,
        ast,
        schema,
        variableValues,
      );
      if (directiveExec) {
        iteratee(directiveExec);
      }
    }
  }
}
