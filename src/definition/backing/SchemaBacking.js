// @flow
import { isNamedType, GraphQLSchema } from 'graphql';
import { ScalarBacking } from './ScalarBacking';
import { ObjectBacking } from './ObjectBacking';
import { InterfaceBacking } from './InterfaceBacking';
import { UnionBacking } from './UnionBacking';
import { DirectiveBacking } from './DirectiveBacking';
import { EnumBacking } from './EnumBacking';
import { SchemaDefinition } from '../SchemaDefinition';
import {
  isDefinitionLike,
  extractSchemaBacking,
  extractNamedTypeBacking,
} from '../../utilities';
import { assert } from './utils';
import { set } from '../../jsutils/lodash.custom';
import { merge } from '../merge';

export const BACKING_VERSION = '1.0.0';

export class SchemaBacking {
  _types: any;
  _directives: any;
  constructor(backing: any) {
    this._functions = {};
    this._types = {};
    this._directives = {};

    if (backing) {
      this.import(backing);
    }
  }

  Function(name: string, func: () => ?mixed) {
    assert(
      name && typeof name === 'string',
      'function name must be non-empty string',
    );
    assert(typeof func === 'function', 'function must be a function');
    set(this._backing, ['_functions', name], func);
    return this;
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

  Enum(name: string) {
    return new EnumBacking(this, name);
  }

  import(object: any) {
    if (
      object instanceof SchemaBacking ||
      object instanceof SchemaDefinition ||
      isDefinitionLike(object)
    ) {
      return this.merge(object);
    } else if (object instanceof GraphQLSchema) {
      return this.merge(extractSchemaBacking(object));
    } else if (isNamedType(object)) {
      return this.merge(extractNamedTypeBacking(object));
    }
  }

  merge(backing) {
    return merge(this, backing);
  }

  toObject() {
    return {
      types: this.types,
      directives: this.directives,
      functions: this.functions,
    };
  }

  toJSON() {
    return this.toObject();
  }

  get types(): ObjMap<?TypeBackingConfig> {
    return this._types;
  }

  get directives(): ObjMap<?DirectiveBackingConfig> {
    return this._directives;
  }

  get functions(): ObjMap<?() => mixed> {
    return this._functions;
  }

  get version(): string {
    return BACKING_VERSION;
  }
}
