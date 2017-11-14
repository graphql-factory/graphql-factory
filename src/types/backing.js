/**
 * The SchemaBacking class enforces the structure of a SchemaBackingConfig.
 * It also provides chain-able methods that allow programmatic configuration
 * of a SchemaBackingConfig with validation. The SchemaBackingConfig itself
 * can be a plain javascript object that follows the SchemaBackingConfig
 * specification.
 *
 * SchemaBackings are used to hydrate resolvers/functions on schemas
 * created with buildSchema via the Schema Language. This is necessary
 * because resolvers/functions cannot be expressed in schema language.
 *
 * Specification:
 *
 * type SchemaBackingConfig {
 *   [typeOrDirectiveName: string]: SchemaBackingFieldConfig |
 *     DirectiveResolverConfig
 * }
 *
 * type SchemaBackingFieldConfig {
 *   [fieldOrFunctionName: string]: GraphQLFieldResolver |
 *     GraphQLTypeResolver | GraphQLIsTypeOfFn | () => mixed
 * }
 *
 * type DirectiveResolverConfig {
 *   resolveRequest: ?GraphQLFieldResolver,
 *   resolveResult: ?GraphQLFieldResolver
 * }
 *
 * Conventions:
 *   * Directive Names - Directive names should be prefixed with an @
 *     in order to differentiate them from Type Names (i.e. "@skip")
 *   * Non-Resolver field names - Functions like isTypeOf, resolveType,
 *     serialize, etc. are all functions that are applied at the top
 *     level of the object config. In order to keep the backing object
 *     as flat as possible these top level functions should be prefixed
 *     with an _ in order to differentiate them from resolver field names
 *     (i.e. "_serialize" for serialize and "readFoo" for readFoo field resolver)
 *
 * @flow
 */

import set from '../jsutils/set'
import {ObjMap} from 'graphql/jsutils/ObjMap';
import type {
  GraphQLFieldResolver,
  GraphQLIsTypeOfFn,
  GraphQLTypeResolver
} from 'graphql/type/definition'



class BackingChain {
  constructor (backing) {
    this._backing = backing
  }

  Scalar (name: string) {
    return this._backing.Scalar(name);
  }

  Object (name: string) {
    return this._backing.Object(name);
  }

  Interface (name: string) {
    return this._backing.Interface(name);
  }

  Union (name: string) {
    return this._backing.Union(name);
  }

  Directive (name: string) {
    return this._backing.Directive(name);
  }

  get backing () {
    return this._backing._backing;
  }
}

class ScalarBacking extends BackingChain {
  constructor (backing, name) {
    super(backing);
    this._name = name;
  }

  serialize (func: (value: mixed) => ?mixed) {
    set(
      this._backing,
      ['_backing', this._name, '_serialize'],
      func
    );
    return this;
  }

  parseValue (func: (value: mixed) => ?mixed) {
    set(
      this._backing,
      ['_backing', this._name, '_parseValue'],
      func
    );
    return this;
  }

  parseLiteral (func: (valueNode: ValueNode) => ?mixed) {
    set(
      this._backing,
      ['_backing', this._name, '_parseLiteral'],
      func
    );
    return this;
  }
}

class ObjectBacking extends BackingChain {
  constructor (backing, name: string) {
    super(backing);
    this._name = name;
  }

  resolve (fieldName: string, resolver: GraphQLFieldResolver) {
    set(
      this._backing,
      ['_backing', this._name, fieldName],
      resolver
    );
    return this;
  }

  isTypeOf (func: GraphQLIsTypeOfFn) {
    set(
      this._backing,
      ['_backing', this._name, '_isTypeOf'],
      func
    );
    return this;
  }
}

class InterfaceBacking extends BackingChain {
  constructor (backing, name: string) {
    super(backing);
    this._name = name;
  }

  resolve (fieldName: string, resolver: GraphQLFieldResolver) {
    set(
      this._backing,
      ['_backing', this._name, fieldName],
      resolver
    );
    return this;
  }

  resolveType (func: GraphQLTypeResolver) {
    set(
      this._backing,
      ['_backing', this._name, '_resolveType'],
      func
    );
    return this;
  }
}

class UnionBacking extends BackingChain {
  constructor (backing, name: string) {
    super(backing);
    this._name = name;
  }

  resolveType (func: GraphQLTypeResolver) {
    set(
      this._backing,
      ['_backing', this._name, '_resolveType'],
      func
    );
    return this;
  }
}

class DirectiveBacking extends BackingChain {
  constructor (backing, name: string) {
    super(backing);
    this._name = `@${name.replace(/^@/, '')}`;
  }

  resolveRequest (func: GraphQLTypeResolver) {
    set(
      this._backing,
      ['_backing', this._name, 'resolveRequest'],
      func
    );
    return this;
  }

  resolveResult (func: GraphQLTypeResolver) {
    set(
      this._backing,
      ['_backing', this._name, 'resolveResult'],
      func
    );
    return this;
  }
}

/**
 * Validates the backing object
 * @param backing
 * @returns {boolean}
 */
function validateBacking (backing: { [string]: mixed }) {
  for (const key of Object.keys(backing)) {
    const value = backing[key];

    // every value is an object
    if (typeof value !== 'object' || value === null) return false;

    // validate directives
    if (key.match(/^@/)) {
      const { resolveRequest, resolveResult } = value;
      if (typeof resolveRequest !== 'function' &&
        typeof resolveResult !== 'function') {
        return false;
      } else if (resolveRequest && typeof resolveRequest !== 'function') {
        return false;
      } else if (resolveResult && typeof resolveResult !== 'function') {
        return false;
      }
    } else {
      // loop through the fields, they should all be functions
      for (const field of Object.keys(value)) {
        if (typeof value[field] !== 'function') return false
      }
    }
  }
  return true;
}

export type SchemaBackingConfig = ObjMap<SchemaBackingFieldConfig |
  DirectiveResolverConfig>;

export type SchemaBackingFieldConfig = ObjMap<GraphQLFieldResolver |
  GraphQLTypeResolver | GraphQLIsTypeOfFn | () => mixed>;

export type DirectiveResolverConfig = {
  resolveRequest: ?GraphQLFieldResolver;
  resolveResult: ?GraphQLFieldResolver;
};

class SchemaBacking {
  constructor (backing?: SchemaBackingConfig | SchemaBacking) {
    let _backing = backing;
    if (backing instanceof SchemaBacking) {
      _backing = backing._backing;
    }
    if (_backing && !validateBacking(_backing)) {
      throw new Error('Invalid SchemaBacking');
    }
    this._backing = _backing || {};
  }

  Scalar (name: string) {
    return new ScalarBacking(this, name);
  }

  Object (name: string) {
    return new ObjectBacking(this, name);
  }

  Interface (name: string) {
    return new InterfaceBacking(this, name);
  }

  Union (name: string) {
    return new UnionBacking(this, name);
  }

  Directive (name: string) {
    return new DirectiveBacking(this, name);
  }

  merge (...backings: Array<SchemaBackingConfig | SchemaBacking>) {
    if (!backings.length) return this

    for (const backing of backings) {
      const _backing = backing instanceof SchemaBacking ?
        backing._backing :
        backing;
      if (!validateBacking(_backing)) {
        throw new Error('Cannot merge invalid SchemaBacking');
      }
      for (const name of Object.keys(_backing)) {
        const value = _backing[value];
        if (!this._backing[name]) {
          this._backing[name] = Object.assign({}, value);
        } else {
          Object.assign(this._backing[name], _backing[name]);
        }
      }
    }
    return this;
  }

  get backing () {
    if (!validateBacking(this._backing)) {
      throw new Error('Invalid SchemaBacking')
    }
    return this._backing
  }
}

// attach the validation function to the backing class
SchemaBacking.validate = validateBacking;

export { SchemaBacking }