import { describe, it } from 'mocha';
import { expect } from 'chai';
import { SchemaDefinition } from '../definition';
import { JSONType, DateTimeType } from '../../types';
import _ from 'lodash';

describe('definition tests', function () {
  it('create an empty definition', function () {
    const def = new SchemaDefinition();
    expect(def.types).to.deep.equal({
      JSON: JSONType,
      DateTime: DateTimeType
    });
    expect(def.context).to.deep.equal({});
    expect(def.functions).to.deep.equal({});
    expect(def.directives).to.deep.equal({});
    expect(def.schema).to.equal(null);
  });

  it('uses type data', function () {
    const def = new SchemaDefinition()
      .use({
        types: {
          Foo: {
            type: 'Object',
            fields: {
              bar: 'String'
            }
          }
        }
      });

    expect(def.types).to.deep.equal({
      JSON: JSONType,
      DateTime: DateTimeType,
      Foo: {
        type: 'Object',
        fields: {
          bar: 'String'
        }
      }
    });
  });
});