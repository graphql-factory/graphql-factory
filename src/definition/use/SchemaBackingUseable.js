import { Useable } from './Useable';
import { SchemaBacking } from '../SchemaBacking';

export class SchemaBackingUseable extends Useable {
  constructor(definition) {
    super(definition);
  }
  _isUsable(backing) {
    return backing instanceof SchemaBacking;
  }
  _use(backing) {
    backing.validate();
    this.definition.merge(backing);

    // use type backings
    /*
    forEach(backing.types, (typeDef, typeName) => {
      forEach(typeDef, (prop, propName) => {
        if (propName === 'fields') {
          forEach(prop, (fieldDef, fieldName) => {
            forEach(fieldDef, (fn, fnName) => {
              _.set(
                this.definition,
                ['_types', typeName, 'fields', fieldName, 'fnName'],
                fn,
              );
            });
          });
        } else {
          _.set(this.definition, ['_types', typeName, propName], prop);
        }
      });
    });

    // use directive backings
    forEach(backing.directives, (dirDef, dirName) => {
      forEach(dirDef._ext, (mw, name) => {
        _.set(this.definition, ['_directives', dirName, 'middleware'], mw);
      });
    });

    // use enum backings
    forEach(backing.enums, (enumDef, enumName) => {
      forEach(enumDef, (value, name) => {
        _.set(
          this.definition,
          ['_types', enumName, 'values', name, 'value'],
          value,
        );
      });
    });
    */
  }
}
