import GraphQLFactory from './GraphQLFactory'

/**
 * Instance of {@link http://graphql.org/graphql-js/ graphql-js}
 * @typedef {Object} GraphQL
 */

/**
 * Factory Definition
 * @typedef {Object} FactoryDefinition
 * @property {Object} globals
 * @property {Object} fields
 * @property {Object.<String, FactoryTypeDefinition>} types
 * @property {Object} schemas
 * @property {Object} functions
 * @property {Object} externalTypes
 * @property {Object} hooks
 */

/**
 * Factory Type Definition
 * @typedef {Object} FactoryTypeDefinition
 * @property {String|Array} type - Type name or array of type names
 * @property {Object} fields - Object and Input types
 * @property {Object} values - Enum type only
 */

/**
 * @ignore
 */
export default GraphQLFactory
