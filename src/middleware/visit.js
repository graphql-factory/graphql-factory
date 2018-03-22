import {
  print,
  parse,
  visit,
  buildSchema,
  Kind,
  DirectiveLocation,
  isSpecifiedScalarType,
} from 'graphql';
import { forEachDirective, getDirectiveLocationFromAST } from './directive';
import { forEach } from '../jsutils';
import {
  getGraphQLTypeName,
  getOperationNode,
  printAndParse,
  parseSchemaIntoAST,
} from '../utilities';
import { getVariableValues } from 'graphql/execution/values';
import { makeExecutableRuntimeSchema } from './runtime';
import { fixRenamed } from './fix';

/**
 * Visits the schema AST and applying any directives
 * @param {*} schema
 * @param {*} globalMiddleware
 * @param {*} variableValues
 */
export function directiveVisitNode(schema, globalMiddleware, variableValues) {
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

    forEachDirective(location, node, schema, variableValues, directiveExec => {
      const {
        visitNode,
        before,
        after,
        directiveArgs,
        directive,
      } = directiveExec;
      if (typeof visitNode === 'function') {
        const visitValue = visitNode(directiveArgs, info);
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
          level: 'global',
          type: 'before',
          class: 'directive',
          location,
          name: directive.name,
          resolve: before,
          args: directiveArgs,
        });
      }

      if (middlewareKey && typeof after === 'function') {
        globalMiddleware[middlewareKey].after.push({
          level: 'global',
          type: 'after',
          class: 'directive',
          location,
          name: directive.name,
          resolve: after,
          args: directiveArgs,
        });
      }
    });
  };
}

export function visitDefinition(location, definition, schema, variableValues) {
  return forEachDirective(
    location,
    definition.astNode,
    schema,
    variableValues,
    exec => {
      if (typeof exec.visit === 'function') {
        exec.visit(definition, exec.directiveArgs);
      }
    },
  );
}

export function visitValueDefinition(def, schema, vars) {
  visitDefinition(DirectiveLocation.ENUM_VALUE, def, schema, vars);
}

export function visitArgDefinition(def, schema, vars) {
  visitDefinition(DirectiveLocation.ARGUMENT_DEFINITION, def, schema, vars);
}

export function visitFieldDefinition(def, schema, vars) {
  visitDefinition(DirectiveLocation.FIELD_DEFINITION, def, schema, vars);
  forEach(def.args, arg => {
    visitArgDefinition(arg, schema, vars);
  });
}

export function visitInputFieldDefinition(def, schema, vars) {
  visitDefinition(DirectiveLocation.INPUT_FIELD_DEFINITION, def, schema, vars);
}

export function visitSchemaDefinition(def, schema, vars) {
  visitDefinition(DirectiveLocation.SCHEMA, def, schema, vars);
}

export function visitScalarDefinition(def, schema, vars) {
  visitDefinition(DirectiveLocation.SCALAR, def, schema, vars);
}

export function visitObjectDefinition(def, schema, vars) {
  visitDefinition(DirectiveLocation.OBJECT, def, schema, vars);
  forEach(def.getFields(), field => {
    visitFieldDefinition(field, schema, vars);
  });
}

export function visitInterfaceDefinition(def, schema, vars) {
  visitDefinition(DirectiveLocation.INTERFACE, def, schema, vars);
  forEach(def.getFields(), field => {
    visitFieldDefinition(field, schema, vars);
  });
}

export function visitUnionDefinition(def, schema, vars) {
  visitDefinition(DirectiveLocation.UNION, def, schema, vars);
}

export function visitEnumDefinition(def, schema, vars) {
  visitDefinition(DirectiveLocation.ENUM, def, schema, vars);
  forEach(def.getValues(), value => {
    visitValueDefinition(value, schema, vars);
  });
}

export function visitInputDefinition(def, schema, vars) {
  visitDefinition(DirectiveLocation.INPUT_OBJECT, def, schema, vars);
  forEach(def.getFields(), field => {
    visitInputFieldDefinition(field, schema, vars);
  });
}

export function visitAllDefinitions(schema, variableValues) {
  visitSchemaDefinition(schema, schema, variableValues);

  forEach(schema.getTypeMap(), (type, name) => {
    if (!name.startsWith('__') && !isSpecifiedScalarType(type)) {
      switch (getGraphQLTypeName(type, true)) {
        case 'GraphQLScalarType':
          return visitScalarDefinition(type, schema, variableValues);
        case 'GraphQLObjectType':
          return visitObjectDefinition(type, schema, variableValues);
        case 'GraphQLInterfaceType':
          return visitInterfaceDefinition(type, schema, variableValues);
        case 'GraphQLUnionType':
          return visitUnionDefinition(type, schema, variableValues);
        case 'GraphQLEnumType':
          return visitEnumDefinition(type, schema, variableValues);
        case 'GraphQLInputObjectType':
          return visitInputDefinition(type, schema, variableValues);
        default:
          break;
      }
    }
  });
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

  const _document = printAndParse({
    kind: Kind.DOCUMENT,
    definitions: [op.operation].concat(
      sourceAST.definitions.filter(definition => {
        return definition.kind !== Kind.OPERATION_DEFINITION;
      }),
    ),
  });

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
          enter: directiveVisitNode(schema, globalMiddleware, vars.coerced),
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

  // visit the definitions
  visitAllDefinitions(runtime.runtimeSchema, vars.coerced);

  // apply rename changes
  fixRenamed(runtime.runtimeSchema);

  // concatenate the before and after global middleware
  const before = globalMiddleware.schema.before.concat(
    globalMiddleware.operation.before,
  );
  const after = globalMiddleware.schema.after.concat(
    globalMiddleware.operation.after,
  );

  return {
    errors: undefined,
    runtimeSchema: runtime.runtimeSchema,
    document: printAndParse(
      visit(_document, {
        enter: directiveVisitNode(schema, globalMiddleware, vars.coerced),
      }),
    ),
    before,
    after,
  };
}
