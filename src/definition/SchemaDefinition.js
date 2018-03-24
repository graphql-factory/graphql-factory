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

  buildSchema() {}
  merge() {}
  validate() {}
  export() {}
}
