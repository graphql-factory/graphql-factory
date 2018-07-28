import { isSpecifiedScalarType, isSpecifiedDirective } from 'graphql';
import { forEach, getGraphQLTypeName } from '../utilities';
import { SchemaBacking } from '../definition';

export function extractScalarBacking(type, backing) {
  const scalar =
    backing instanceof SchemaBacking
      ? backing.Scalar(type.name)
      : new SchemaBacking().Scalar(type.name);
  if (isSpecifiedScalarType(type)) {
    return scalar.backing;
  }
  if (typeof type.serialize === 'function') {
    scalar.serialize(type.serialize);
  }
  if (typeof type.parseValue === 'function') {
    scalar.parseValue(type.parseValue);
  }
  if (typeof type.parseLiteral === 'function') {
    scalar.parseLiteral(type.parseLiteral);
  }
  return scalar.backing;
}

export function extractObjectBacking(type, backing) {
  const object =
    backing instanceof SchemaBacking
      ? backing.Object(type.name)
      : new SchemaBacking().Object(type.name);
  if (typeof type.isTypeOf === 'function') {
    object.isTypeOf(type.isTypeOf);
  }
  forEach(type.getFields(), (field, fieldName) => {
    if (typeof field.resolve === 'function') {
      object.resolve(fieldName, field.resolve);
    }
    if (typeof field.subscribe === 'function') {
      object.subscribe(fieldName, field.subscribe);
    }
  });
  return object.backing;
}

export function extractInterfaceBacking(type, backing) {
  const iface =
    backing instanceof SchemaBacking
      ? backing.Interface(type.name)
      : new SchemaBacking().Interface(type.name);
  if (typeof type.resolveType === 'function') {
    iface.resolveType(type.resolveType);
  }
  forEach(type.getFields(), (field, fieldName) => {
    if (typeof field.resolve === 'function') {
      iface.resolve(fieldName, field.resolve);
    }
    if (typeof field.subscribe === 'function') {
      iface.subscribe(fieldName, field.subscribe);
    }
  });
  return iface.backing;
}

export function extractUnionBacking(type, backing) {
  const union =
    backing instanceof SchemaBacking
      ? backing.Union(type.name)
      : new SchemaBacking().Union(type.name);
  if (typeof type.resolveType === 'function') {
    union.resolveType(type.resolveType);
  }
  return union.backing;
}

export function extractEnumBacking(type, backing) {
  const enu =
    backing instanceof SchemaBacking
      ? backing.Enum(type.name)
      : new SchemaBacking().Enum(type.name);
  forEach(type.getValues(), (value, valueName) => {
    enu.value(valueName, value.value);
  });
  return enu.backing;
}

export function extractDirectiveBacking(type, backing) {
  const dir =
    backing instanceof SchemaBacking
      ? backing.Directive(type.name)
      : new SchemaBacking().Directive(type.name);
  if (!isSpecifiedDirective(type)) {
    forEach(type.middleware, (middleware, middlewareName) => {
      const method = dir[middlewareName];
      if (typeof method === 'function') {
        method(middleware);
      }
    });
  }
  return dir.backing;
}

export function extractNamedTypeBacking(type, existingBacking) {
  const backing =
    existingBacking instanceof SchemaBacking
      ? existingBacking
      : new SchemaBacking();
  switch (getGraphQLTypeName(type)) {
    case 'GraphQLScalarType':
      return extractScalarBacking(type, backing);
    case 'GraphQLObjectType':
      return extractObjectBacking(type, backing);
    case 'GraphQLInterfaceType':
      return extractInterfaceBacking(type, backing);
    case 'GraphQLUnionType':
      return extractUnionBacking(type, backing);
    case 'GraphQLEnumType':
      return extractEnumBacking(type, backing);
    default:
      break;
  }
}

export function extractSchemaBacking(schema, existingBacking) {
  const backing =
    existingBacking instanceof SchemaBacking
      ? existingBacking
      : new SchemaBacking();

  // extract type backings
  forEach(schema.getTypeMap(), (type, typeName) => {
    if (!typeName.startsWith('__')) {
      extractNamedTypeBacking(type, backing);
    }
  });

  // extract directive backings
  forEach(schema.getDirectives(), directive => {
    extractDirectiveBacking(directive, backing);
  });

  return backing;
}
