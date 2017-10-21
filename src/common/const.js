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

export const PRIMITIVES = {
  GraphQLBoolean: BOOLEAN,
  GraphQLFloat: FLOAT,
  GraphQLID: ID,
  GraphQLInt: INT,
  GraphQLString: STRING
}

export const DECOMPOSABLE = [
  'GraphQLEnumType',
  'GraphQLInputObjectType',
  'GraphQLInterfaceType',
  'GraphQLObjectType',
  'GraphQLScalarType',
  'GraphQLSchema',
  'GraphQLUnionType'
]

export const OUTPUT_TYPES = [
  'GraphQLEnumType',
  'GraphQLObjectType',
  'GraphQLScalarType',
  'GraphQLBoolean',
  'GraphQLFloat',
  'GraphQLID',
  'GraphQLInt',
  'GraphQLString',
  'GraphQLList',
  'GraphQLNonNull'
]

export const BEFORE_MIDDLEWARE = 'BEFORE'
export const AFTER_MIDDLEWARE = 'AFTER'
export const ERROR_MIDDLEWARE = 'ERROR'

// types with fields
export const HAS_FIELDS = [ OBJECT, INPUT, INTERFACE ]

export const DEFAULT_MIDDLEWARE_TIMEOUT = 5000