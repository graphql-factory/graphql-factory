// built in type name constants
export const BOOLEAN = 'Boolean'
export const ENUM = 'Enum'
export const FLOAT = 'Float'
export const ID = 'ID'
export const INPUT = 'Input'
export const INT = 'Int'
export const INTERFACE = 'Interface'
export const LIST = 'List'
export const NONNULL = 'NonNull'
export const OBJECT = 'Object'
export const SCALAR = 'Scalar'
export const SCHEMA = 'Schema'
export const STRING = 'String'
export const UNION = 'Union'

// build a type alias
export const TYPE_ALIAS = {
  Enum: ENUM,
  Input: INPUT,
  Interface: INTERFACE,
  List: LIST,
  NonNull: NONNULL,
  Object: OBJECT,
  Scalar: SCALAR,
  Schema: SCHEMA,
  Union: UNION,
  GraphQLEnumType: ENUM,
  GraphQLInputObjectType: INPUT,
  GraphQLInterfaceType: INTERFACE,
  GraphQLList: LIST,
  GraphQLNonNull: NONNULL,
  GraphQLObjectType: OBJECT,
  GraphQLScalarType: SCALAR,
  GraphQLSchema: SCHEMA,
  GraphQLUnionType: UNION
}

// types with fields
export const HAS_FIELDS = [ OBJECT, INPUT, INTERFACE ]

export default {
  BOOLEAN,
  ENUM,
  FLOAT,
  ID,
  INPUT,
  INT,
  INTERFACE,
  LIST,
  NONNULL,
  OBJECT,
  SCALAR,
  SCHEMA,
  STRING,
  UNION,
  TYPE_ALIAS,
  HAS_FIELDS
}