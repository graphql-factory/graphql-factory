import {
  print,
  parse,
  visit,
  buildSchema,
  DirectiveLocation,
  Kind,
} from 'graphql';
import {
  getVariableValues,
  getDirectiveValues,
} from 'graphql/execution/values';
import {
  getOperationNode,
  printAndParse,
  parseSchemaIntoAST,
} from '../utilities';
import { makeExecutableRuntimeSchema } from './runtime';

export const DirectiveMiddleware = Object.freeze({
  visitQuery: 'visitQuery',
  beforeQuery: 'beforeQuery',
  afterQuery: 'afterQuery',

  visitMutation: 'visitMutation',
  beforeMutation: 'beforeMutation',
  afterMutation: 'afterMutation',

  visitSubscription: 'visitSubscription',
  beforeSubscription: 'beforeSubscription',
  afterSubscription: 'afterSubscription',

  visitField: 'visitField',
  beforeField: 'beforeField',
  afterField: 'afterField',

  visitFragmentDefinition: 'visitFragmentDefinition',
  visitFragmentSpread: 'visitFragmentSpread',
  visitInlineFragment: 'visitInlineFragment',

  visitSchema: 'visitSchema',
  beforeSchema: 'beforeSchema',
  afterSchema: 'afterSchema',

  visitScalar: 'visitScalar',
  visitObject: 'visitObject',

  visitFieldDefinition: 'visitFieldDefinition',
  beforeFieldDefinition: 'beforeFieldDefinition',
  afterFieldDefinition: 'afterFieldDefinition',

  visitArgumentDefinition: 'visitArgumentDefinition',
  visitInterface: 'visitInterface',
  visitUnion: 'visitUnion',
  visitEnum: 'visitEnum',
  visitEnumValue: 'visitEnumValue',
  visitInputObject: 'visitInputObject',
  visitInputFieldDefinition: 'visitInputFieldDefinition',
});

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

export function getDirectiveByLocation(
  location,
  node,
  ast,
  schema,
  variableValues,
) {
  const directive = schema.getDirective(ast.name.value);
  if (directive && directive._ext) {
    const visitFn = directive._ext[camel(`VISIT_${location}`)];
    const before = directive._ext[camel(`BEFORE_${location}`)];
    const after = directive._ext[camel(`AFTER_${location}`)];
    const directiveArgs = getDirectiveValues(directive, node, variableValues);
    return { visit: visitFn, before, after, directiveArgs };
  }
}

export function directiveEnter(schema, globalMiddleware, variableValues) {
  return function enter(node, key, parent, path, ancestors) {
    const info = {
      node,
      key,
      parent,
      path,
      ancestors,
      schema,
      variableValues,
    };
    const location = getDirectiveLocationFromAST(node, ancestors);
    if (!location || !node.directives || !node.directives.length) {
      return;
    }

    // look at each directive attached to the location
    for (let i = 0; i < node.directives.length; i++) {
      const ast = node.directives[i];
      const directiveInfo = getDirectiveByLocation(
        location,
        node,
        ast,
        schema,
        variableValues,
      );
      if (directiveInfo) {
        const { visit: visitFn, before, after, directiveArgs } = directiveInfo;
        if (typeof visitFn === 'function') {
          const visitValue = visitFn(directiveArgs, info);
          if (visitValue !== undefined) {
            return visitValue;
          }
        }

        let middlewareKey = null;
        switch (location) {
          case DirectiveLocation.SCHEMA:
            middlewareKey = 'schema';
            break;
          case DirectiveLocation.QUERY:
          case DirectiveLocation.MUTATION:
          case DirectiveLocation.SUBSCRIPTION:
            middlewareKey = 'operation';
            break;
          default:
            break;
        }

        if (middlewareKey && typeof before === 'function') {
          globalMiddleware[middlewareKey].before.push({
            type: 'before',
            resolve: before,
            args: directiveArgs,
          });
        }

        if (middlewareKey && typeof after === 'function') {
          globalMiddleware[middlewareKey].after.push({
            type: 'after',
            resolve: after,
            args: directiveArgs,
          });
        }
      }
    }
  };
}

export function applyDirectiveVisitors(
  schema,
  source,
  variableValues,
  extensionMap,
  operationName,
) {
  const globalMiddleware = {
    schema: {
      before: [],
      after: [],
    },
    operation: {
      before: [],
      after: [],
    },
  };
  const schemaAST = parseSchemaIntoAST(schema);
  const sourceAST = parse(source);
  const op = getOperationNode(sourceAST, operationName);
  if (op.errors) {
    return {
      errors: op.errors,
      runtimeSchema: undefined,
      document: undefined,
      before: undefined,
      after: undefined,
    };
  }

  const vars = getVariableValues(
    schema,
    op.operation.variableDefinitions,
    variableValues,
  );

  if (vars.errors) {
    return {
      errors: vars.errors,
      runtimeSchema: undefined,
      document: undefined,
      before: undefined,
      after: undefined,
    };
  }

  const runtime = makeExecutableRuntimeSchema(
    schema,
    buildSchema(
      print(
        visit(schemaAST, {
          enter: directiveEnter(schema, globalMiddleware, vars.coerced),
        }),
      ),
    ),
    extensionMap,
  );

  if (runtime.errors) {
    return {
      errors: runtime.errors,
      runtimeSchema: undefined,
      document: undefined,
      before: undefined,
      after: undefined,
    };
  }

  // concatenate the before and after global middleware
  const before = globalMiddleware.schema.before.concat(
    globalMiddleware.operation.before,
  );
  const after = globalMiddleware.schema.after.concat(
    globalMiddleware.operation.after,
  );

  const operationDefinition = visit(op.operation, {
    enter: directiveEnter(schema, globalMiddleware, vars.coerced),
  });

  return {
    errors: undefined,
    runtimeSchema: runtime.runtimeSchema,
    document: printAndParse({
      kind: Kind.DOCUMENT,
      definitions: [operationDefinition].concat(
        sourceAST.definitions.filter(definition => {
          return definition.kind !== Kind.OPERATION_DEFINITION;
        }),
      ),
    }),
    before,
    after,
  };
}
