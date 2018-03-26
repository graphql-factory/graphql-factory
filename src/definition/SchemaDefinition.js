import EventEmitter from 'events';
import {
  DefinitionLikeUseable,
  LanguageUseable,
  NamedTypeUseable,
  ReadableUseable,
  SchemaBackingUseable,
  SchemaDefinitionUseable,
  SchemaUseable,
  UndefinedUseable,
  UseableUseable,
} from './use';
import { merge } from './merge';

export class SchemaDefinition extends EventEmitter {
  constructor(options) {
    super();
    this._build = null;
    this._options = Object.assign({}, options);
    this._context = {};
    this._functions = {};
    this._directives = {};
    this._types = {};
    this._schema = null;
    this._plugins = {};
    this._useables = [
      UseableUseable,
      SchemaBackingUseable,
      SchemaDefinitionUseable,
      SchemaUseable,
      NamedTypeUseable,
      DefinitionLikeUseable,
      ReadableUseable,
      LanguageUseable,
      UndefinedUseable,
    ];
  }

  use(...args) {
    for (let i = 0; i < this._useables.length; i++) {
      const useable =
        typeof this._useables[i] === 'function'
          ? new this._useables[i](this)
          : this._useable[i];
      if (useable.isUseable(...args)) {
        return useable.use(...args);
      }
    }
    throw new Error('Cannot use arguments');
  }

  merge(definition) {
    return merge(this, definition);
  }

  validate() {}

  export() {}

  buildSchema() {}

  toObject() {
    return {
      context: this.context,
      functions: this.functions,
      types: this.types,
      directives: this.directives,
      schema: this.schema,
    };
  }

  toJSON() {
    return this.toObject();
  }

  get context() {
    return this._context;
  }

  get functions() {
    return this._functions;
  }

  get types() {
    return this._types;
  }

  get directives() {
    return this._directives;
  }

  get schema() {
    return this._schema;
  }
}
