import { lodash as _, isObject } from '../jsutils';
import {
  Kind,
  isNamedType,
  printType,
  parse,
  valueFromASTUntyped,
} from 'graphql';

export function astFromType(type) {
  if (!isNamedType(type)) {
    throw new Error('ast cannot be extracted from non-named types');
  } else if (type.astNode) {
    return type.astNode;
  }
  const description = type.description;
  const ast = _.get(parse(printType(type)), 'definitions[0]');
  ast.description = ast.description || description;
  return ast;
}

export function astToTypeString(ast) {
  switch (ast.kind) {
    case Kind.NON_NULL_TYPE:
      return `${astToTypeString(ast.type)}!`;
    case Kind.LIST_TYPE:
      return `[${astToTypeString(ast.type)}]`;
    case Kind.NAMED_TYPE:
      return ast.name.value;
  }
}

export function astKindToFactoryType(kind) {
  switch (kind) {
    case Kind.OBJECT_TYPE_DEFINITION:
      return 'Object';
    case Kind.INPUT_OBJECT_TYPE_DEFINITION:
      return 'Input';
    case Kind.INTERFACE_TYPE_DEFINITION:
      return 'Interface';
    case Kind.SCALAR_TYPE_DEFINITION:
      return 'Scalar';
    case Kind.UNION_TYPE_DEFINITION:
      return 'Union';
    case Kind.ENUM_TYPE_DEFINITION:
      return 'Enum';
    default:
      break;
  }
}

export function astToFactoryDefinition(ast, definition) {
  const def = isObject(definition) ? definition : {};
  switch (ast.kind) {
    case Kind.DOCUMENT:
      return ast.definitions.reduce((d, node) => {
        astToFactoryDefinition(node, d);
        return d;
      }, def);
    case Kind.SCHEMA_DEFINITION:
      _.set(
        def,
        'schema',
        ast.operationTypes.reduce((ops, node) => {
          ops[node.operation] = node.type.name.value;
          return ops;
        }, {}),
      );
      return _.set(
        def,
        ['schema', '@directives'],
        ast.directives.map(node => {
          return astToFactoryDefinition(node);
        }),
      );
    case Kind.SCALAR_TYPE_DEFINITION:
      return _.set(def, ['types', ast.name.value], {
        type: astKindToFactoryType(ast.kind),
        name: ast.name.value,
        description: ast.description,
        '@directives': ast.directives.map(node => {
          return astToFactoryDefinition(node);
        }),
      });
    case Kind.UNION_TYPE_DEFINITION:
      return _.set(def, ['types', ast.name.value], {
        type: astKindToFactoryType(ast.kind),
        name: ast.name.value,
        description: ast.description,
        types: ast.types.map(node => node.name.value),
        '@directives': ast.directives.map(node => {
          return astToFactoryDefinition(node);
        }),
      });
    case Kind.INTERFACE_TYPE_DEFINITION:
      return _.set(def, ['types', ast.name.value], {
        type: astKindToFactoryType(ast.kind),
        name: ast.name.value,
        description: ast.description,
        fields: ast.fields.reduce((fields, node) => {
          astToFactoryDefinition(node, fields);
          return fields;
        }, {}),
        '@directives': ast.directives.map(node => {
          return astToFactoryDefinition(node);
        }),
      });
    case Kind.OBJECT_TYPE_DEFINITION:
      return _.set(def, ['types', ast.name.value], {
        type: astKindToFactoryType(ast.kind),
        name: ast.name.value,
        description: ast.description,
        interfaces: ast.interfaces.map(node => node.name.value),
        fields: ast.fields.reduce((fields, node) => {
          astToFactoryDefinition(node, fields);
          return fields;
        }, {}),
        '@directives': ast.directives.map(node => {
          return astToFactoryDefinition(node);
        }),
      });
    case Kind.INPUT_OBJECT_TYPE_DEFINITION:
      return _.set(def, ['types', ast.name.value], {
        type: astKindToFactoryType(ast.kind),
        name: ast.name.value,
        description: ast.description,
        fields: ast.fields.reduce((fields, node) => {
          astToFactoryDefinition(node, fields);
          return fields;
        }, {}),
        '@directives': ast.directives.map(node => {
          return astToFactoryDefinition(node);
        }),
      });
    case Kind.ENUM_TYPE_DEFINITION:
      return _.set(def, ['types', ast.name.value], {
        type: astKindToFactoryType(ast.kind),
        name: ast.name.value,
        description: ast.description,
        values: ast.values.reduce((values, node) => {
          astToFactoryDefinition(node, values);
          return values;
        }, {}),
        '@directives': ast.directives.map(node => {
          return astToFactoryDefinition(node);
        }),
      });
    case Kind.ENUM_VALUE_DEFINITION:
      return _.set(def, [ast.name.value], {
        description: ast.description,
        value: ast.name.value,
        '@directives': ast.directives.map(node => {
          return astToFactoryDefinition(node);
        }),
      });
    case Kind.DIRECTIVE_DEFINITION:
      return _.set(def, ['directives', ast.name.value], {
        name: ast.name.value,
        description: ast.description,
        locations: ast.locations.map(node => node.value),
        args: ast.arguments.reduce((args, node) => {
          astToFactoryDefinition(node, args);
          return args;
        }, {}),
      });
    case Kind.FIELD_DEFINITION:
      return _.set(def, [ast.name.value], {
        description: ast.description,
        type: astToTypeString(ast.type),
        args: ast.arguments.reduce((args, node) => {
          astToFactoryDefinition(node, args);
          return args;
        }, {}),
        '@directives': ast.directives.map(node => {
          return astToFactoryDefinition(node);
        }),
      });
    case Kind.INPUT_VALUE_DEFINITION:
      return _.set(def, [ast.name.value], {
        description: ast.description,
        type: astToTypeString(ast.type),
        defaultValue: ast.defaultValue
          ? valueFromASTUntyped(ast.defaultValue)
          : undefined,
        '@directives': ast.directives.map(node => {
          return astToFactoryDefinition(node);
        }),
      });
    case Kind.DIRECTIVE:
      return {
        name: ast.name.value,
        args: ast.arguments.reduce((args, node) => {
          astToFactoryDefinition(node, args);
          return args;
        }, {}),
      };
    case Kind.ARGUMENT:
      return _.set(def, [ast.name.value], valueFromASTUntyped(ast.value));
    default:
      break;
  }
}
