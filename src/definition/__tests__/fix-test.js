import { describe, it } from 'mocha';
import { expect } from 'chai';
import { SchemaDefinition } from '../definition';
import { fixDefinition } from '../fix';

describe('definition.fix tests', function () {
  it('fix shorthand types', async function () {
    const definition = await new SchemaDefinition()
      .use({
        types: {
          Foo: {
            fields: {
              id: 'String'
            }
          }
        }
      })
      .definition;
    fixDefinition.call(definition);
    expect(definition.types.Foo).to.deep.equal({
      type: 'Object',
      fields: {
        id: { type: 'String' }
      }
    });
  });
});
