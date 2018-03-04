import { describe, it } from 'mocha';
import { expect } from 'chai';
import { SchemaDefinition } from '../definition';
import { JSONType, DateTimeType } from '../../types';

describe('definition.definition tests', function() {
  it('create an empty definition', async function() {
    const def = await new SchemaDefinition().definition;
    expect(def.types).to.deep.equal({
      JSON: JSONType,
      DateTime: DateTimeType,
    });
    expect(def.context).to.deep.equal({});
    expect(def.functions).to.deep.equal({});
    expect(def.directives).to.deep.equal({});
    expect(def.schema).to.equal(null);
  });

  it('uses type data', async function() {
    const def = await new SchemaDefinition().use({
      types: {
        Foo: {
          type: 'Object',
          fields: {
            bar: 'String',
          },
        },
      },
    }).definition;
    expect(def.types).to.deep.equal({
      JSON: JSONType,
      DateTime: DateTimeType,
      Foo: {
        type: 'Object',
        fields: {
          bar: { type: 'String' },
        },
      },
    });
  });
});
