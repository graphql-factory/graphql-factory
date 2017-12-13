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
 * Example backing config object
 * 
 * const backingConfig = {
 *   types: {
 *     [TypeName]: {
 *       fields: {
 *         name: {
 *           resolve,
 *           subscribe
 *         }
 *       },
 *       resolveType,
 *       serialize,
 *       ...
 *     },
 *     ...
 *   },
 *   directives: {
 *     [DirectiveName]: {
 *       resolve,
 *       resolveResult,
 *       beforeBuild
 *     },
 *     ...
 *   }
 * }
 * 
 * @flow
 */
import type { ObjMap } from 'graphql/jsutils/ObjMap';
import type { ValueNode, GraphQLFieldResolver } from 'graphql';
import {
  lodash as _,
  stringMatch,
  asrt,
  forEach,
  reduce,
  errors
} from '../jsutils';

export const BACKING_VERSION = '1.0.0';

/**
 * Assert errors as backing errors
 * @param {*} condition 
 * @param {*} message 
 */
function assert(condition: boolean, message: string) {
  asrt('backing', condition, message);
  return true;
}

/**
 * Assert a function
 * @param {*} fn 
 * @param {*} name 
 */
function assertFn(fn: any, name: string) {
  return fn ?
    assert(_.isFunction(fn), `${name} must be a function`) :
    false;
}

/**
 * Assert an object
 * @param {*} obj 
 * @param {*} name 
 */
function assertObj(obj: any, name: string) {
  return obj ?
    assert(_.isObjectLike(obj), `${name} must be an object`) :
    false;
}

/**
 * Validates a backing config
 * @param {*} backing 
 */
function validate(backing: any) {
  let isValid = false;
  assertObj(backing, 'backing');
  assert(
    _.isObjectLike(backing.types) || _.isObjectLike(backing.directives),
    'backing must have either "types" or "directives" backing values'
  );

  // validate the type backing config
  forEach(backing.types, config => {
    let valid = false;
    assertObj(config, 'type backing');
    valid = valid || assertFn(config.serialize, 'serialize');
    valid = valid || assertFn(config.parseValue, 'parseValue');
    valid = valid || assertFn(config.parseLiteral, 'parseLiteral');
    valid = valid || assertFn(config.isTypeOf, 'isTypeOf');
    valid = valid || assertFn(config.resolveType, 'resolveType');

    if (config.fields) {
      assertObj(config.fields, 'fields backing');
      forEach(config.fields, field => {
        let validf = false;
        assertObj(field, 'field backing');
        validf = validf || assertFn(field.resolve, 'resolve');
        validf = validf || assertFn(field.subscribe, 'subscribe');
        assert(validf, 'no field backing configuration was found');
        valid = true;
      }, true);
    }
    assert(valid, 'no type backing configuration was found');
    isValid = true;
  }, true);

  // validate the directive backing config
  forEach(backing.directives, config => {
    let valid = false;
    assert(_.isObjectLike(config), 'directive backing must be an object');
    valid = valid || assertFn(config.resolve, 'resolve');
    valid = valid || assertFn(config.resolveResult, 'resolveResult');
    valid = valid || assertFn(config.beforeBuild, 'beforeBuild');
    assert(valid, 'no directive backing configuration was found');
    isValid = true;
  }, true);

  // assert at least one config was found
  assert(isValid, 'no type or directive backing configuration was found');
}

/**
 * Exports a schema backing as a resolverMap consumable by
 * graphql-tools and possibly other tools
 * @param {*} backing 
 */
function exportResolverMap(backing: SchemaBacking) {
  backing.validate();
  return reduce(backing.types, (rmap, config, name) => {
    const fields = reduce(config.fields, (fmap, field, fieldName) => {
      if (_.isFunction(field.resolve)) {
        fmap[fieldName] = field.resolve;
      }
      return fmap;
    }, {}, true);
    return _.keys(fields).length ?
      _.merge(rmap, { [name]: fields }) :
      rmap;
  }, {}, true);
}

/**
 * Base TypeBacking class sets backing, name, and provides
 * methods for chaing new backing types
 */
class TypeBacking {
  _backing: SchemaBacking;
  _name: string;
  constructor(backing: SchemaBacking, name: string) {
    assert(stringMatch(name, true), 'Name must be non-empty string');
    this._backing = backing;
    this._name = name;
  }
  Directive(name: string) {
    return this._backing.Directive(name);
  }
  Interface(name: string) {
    return this._backing.Interface(name);
  }
  Object(name: string) {
    return this._backing.Object(name);
  }
  Scalar(name: string) {
    return this._backing.Scalar(name);
  }
  Union(name: string) {
    return this._backing.Union(name);
  }
}

/**
 * Type with field resolvers
 */
class ResolvableBacking extends TypeBacking {
  constructor(backing: SchemaBacking, name: string) {
    super(backing, name);
  }
  resolve(field: string, resolver: () => ?mixed) {
    assert(stringMatch(field, true), 'field name must be non-empty string');
    assert(_.isFunction(resolver), 'resolver must be a function');
    const path = [ '_types', this._name, 'fields', field, 'resolve' ];
    _.set(this._backing, path, resolver);
    return this;
  }
  subscribe(field: string, subscriber: () => ?mixed) {
    assert(stringMatch(field, true), 'field name must be non-empty string');
    assert(_.isFunction(subscriber), 'subscriber must be a function');
    const path = [ '_types', this._name, 'fields', field, 'subscribe' ];
    _.set(this._backing, path, subscriber);
    return this;
  }
}

/**
 * Provides a backing builder for scalar types
 */
export class ScalarBacking extends TypeBacking {
  constructor(backing: SchemaBacking, name: string) {
    super(backing, name);
  }
  serialize(func: (value: any) => any) {
    assert(_.isFunction(func), 'serialize must be a function');
    _.set(this._backing, [ '_types', this._name, 'serialize' ], func);
    return this;
  }
  parseValue(func: (value: mixed) => ?mixed) {
    assert(_.isFunction(func), 'parseValue must be a function');
    _.set(this._backing, [ '_types', this._name, 'parseValue' ], func);
    return this;
  }
  parseLiteral(func: (valueNode: ValueNode) => ?mixed) {
    assert(_.isFunction(func), 'parseLiteral must be a function');
    _.set(this._backing, [ '_types', this._name, 'parseLiteral' ], func);
    return this;
  }
}

/**
 * Provides a backing builder for object types
 */
export class ObjectBacking extends ResolvableBacking {
  constructor(backing: SchemaBacking, name: string) {
    super(backing, name);
  }
  isTypeOf(func: () => ?mixed) {
    assert(_.isFunction(func), 'isTypeOf must be a function');
    _.set(this._backing, [ '_types', this._name, 'isTypeOf' ], func);
    return this;
  }
}

/**
 * Provides a backing builder for interface types
 */
export class InterfaceBacking extends ResolvableBacking {
  constructor(backing: SchemaBacking, name: string) {
    super(backing, name);
  }
  resolveType(func: () => ?mixed) {
    assert(_.isFunction(func), 'resolveType must be a function');
    _.set(this._backing, [ '_types', this._name, 'resolveType' ], func);
    return this;
  }
}

/**
 * Provides a backing builder for union types
 */
export class UnionBacking extends TypeBacking {
  constructor(backing: SchemaBacking, name: string) {
    super(backing, name);
  }
  resolveType(func: () => ?mixed) {
    assert(_.isFunction(func), 'resolveType must be a function');
    _.set(this._backing, [ '_types', this._name, 'resolveType' ], func);
    return this;
  }
}

/**
 * Provides a backing builder for directives
 */
export class DirectiveBacking extends TypeBacking {
  constructor(backing: SchemaBacking, name: string) {
    super(backing, name);
  }
  resolve(func: () => ?mixed) {
    assert(_.isFunction(func), 'resolve requires a function');
    _.set(this._backing, [ '_directives', this._name, 'resolve' ], func);
    return this;
  }
  resolveResult(func: () => ?mixed) {
    assert(_.isFunction(func), 'resolveResult requires a function');
    _.set(this._backing, [ '_directives', this._name, 'resolveResult' ], func);
    return this;
  }
  beforeBuild(func: () => ?mixed) {
    assert(_.isFunction(func), 'beforeBuild requires a function');
    _.set(this._backing, [ '_directives', this._name, 'beforeBuild' ], func);
    return this;
  }
}

/**
 * Provides a builder class for creating a SchemaBackingConfig
 */
export class SchemaBacking {
  _types: any;
  _directives: any;
  constructor(backing?: SchemaBacking | SchemaBackingConfig) {
    this._types = Object.create(null);
    this._directives = Object.create(null);
    if (backing) {
      this.merge(backing);
    }
  }
  Scalar(name: string) {
    return new ScalarBacking(this, name);
  }
  Object(name: string) {
    return new ObjectBacking(this, name);
  }
  Interface(name: string) {
    return new InterfaceBacking(this, name);
  }
  Union(name: string) {
    return new UnionBacking(this, name);
  }
  Directive(name: string) {
    return new DirectiveBacking(this, name);
  }
  get types(): ObjMap<?TypeBackingConfig> {
    return this._types;
  }
  get directives(): ObjMap<?DirectiveBackingConfig> {
    return this._directives;
  }
  get backing(): SchemaBackingConfig {
    return {
      types: this.types,
      directives: this.directives
    };
  }
  get version(): string {
    return BACKING_VERSION;
  }

  /**
   * Validates a schema backing config if passed or self if no argument
   * @param {*} config 
   */
  validate(config?: SchemaBackingConfig) {
    validate(config ? config : this.backing);
  }

  /**
   * Merges one or more backings into the current backing
   * @param {*} backings 
   */
  merge(...backings: Array<SchemaBackingConfig | SchemaBacking>) {
    forEach(backings, backing => {
      const _backing = backing instanceof SchemaBacking ?
        backing.backing :
        backing;
      this.validate(_backing);
      _.merge(this._types, _backing.types);
      _.merge(this._directives, _backing.directives);
    }, true);
    return this;
  }

  /**
   * Exports a backing in various formats. Depending on
   * the format, some data may be lost or not available
   * @param {*} format 
   */
  export(format: string) {
    switch (format) {
      case 'resolverMap':
        return exportResolverMap(this);
      default:
        throw new errors.SchemaBackingError('invalid export format');
    }
  }
}

export type SchemaBackingConfig = {
  types: ObjMap<?TypeBackingConfig>,
  directives: ObjMap<?DirectiveBackingConfig>
};

export type FieldBackingConfig = {
  resolve?: ?GraphQLFieldResolver<*, *>,
  subscribe?: ?GraphQLFieldResolver<*, *>
};

export type TypeBackingConfig = {
  fields?: ?FieldBackingConfig,
  serialize?: ?(value: any) => any,
  parseValue: ?(value: mixed) => ?mixed,
  parseLiteral: ?(valueNode: ValueNode) => ?mixed,
  resolveType: ?() => ?mixed,
  isTypeOf: ?() => ?mixed
};

export type DirectiveBackingConfig = {
  resolve?: ?GraphQLFieldResolver<*, *>,
  resolveResult?: ?GraphQLFieldResolver<*, *>,
  beforeBuild?: ?() => any
};
