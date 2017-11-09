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

// type alias values
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

// built in scalars. do not decompose
export const SCALAR_NAMES = [
  'Int',
  'Boolean',
  'String',
  'ID',
  'Float'
]

// decomposable types
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

// middleware types
export const BEFORE_MIDDLEWARE = 'BEFORE'
export const AFTER_MIDDLEWARE = 'AFTER'
export const ERROR_MIDDLEWARE = 'ERROR'
export const RESOLVE_MIDDLEWARE = 'RESOLVE'

// event names
export const EVENT_REQUEST = 'request'
export const EVENT_FATAL = 'fatal'
export const EVENT_ERROR = 'error'
export const EVENT_WARN = 'warn'
export const EVENT_INFO = 'info'
export const EVENT_DEBUG = 'debug'
export const EVENT_TRACE = 'trace'

// option defaults and constants
export const DEFAULT_MIDDLEWARE_TIMEOUT = 300000 // 5 minutes
export const RANDOM_MAX = 1000000000000000


