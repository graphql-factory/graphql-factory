import { describe, it } from 'mocha';
import { expect } from 'chai';
import { SchemaDefinition } from '../definition';
import { fixDefinition } from '../fix';

describe('definition.fix tests', function () {
  it('fix shorthand types', function () {
    const definition = new SchemaDefinition()
      .use({
        types: {
          Foo: {
            fields: {
              id: 'String'
            }
          }
        }
      });
    fixDefinition.call(definition);
    expect(definition.types.Foo).to.deep.equal({
      type: 'Object',
      fields: {
        id: { type: 'String' }
      }
    });
  });
});
