import _ from 'lodash';
import { describe, it } from 'mocha';
import { expect } from 'chai';
// import { ConflictResolution } from '../const';
import {
  // mergeDefinition,
  // defaultConflictResolver,
  // getConflictResolver,
  // conflictMerge,
  defaultSchemaConflictResolver
} from '../merge';

describe('definition.merge tests', function () {
  it('tests defaultSchemaConflictResolver', function () {
    const def = {
      types: {
        OldQuery: {
          name: 'OldQuery',
          fields: {
            id: { type: 'String' },
            oldField: { type: 'String' }
          }
        },
        NewQuery: {
          name: 'NewQuery',
          fields: {
            id: { type: 'String' },
            newField: { type: 'String' }
          }
        }
      }
    };

    const def1 = _.cloneDeep(def);
    defaultSchemaConflictResolver(def1, 'OldQuery', 'NewQuery');
    expect(def1).to.deep.equal({
      types: {
        OldQuery: {
          name: 'OldQuery',
          fields: {
            id: { type: 'String' },
            oldField: { type: 'String' },
            newField: { type: 'String' }
          }
        },
        NewQuery: {
          name: 'NewQuery',
          fields: {
            id: { type: 'String' },
            newField: { type: 'String' }
          }
        }
      }
    });

    const def2 = {
      types: {
        OldQuery: {
          name: 'OldQuery',
          fields: {
            id: { type: 'String' },
            oldField: { type: 'String' }
          }
        }
      }
    };
    const def2c = _.cloneDeep(def2);
    defaultSchemaConflictResolver(def2c, 'OldQuery', 'NewQuery');
    expect(def2c).to.deep.equal(def2);


    const def3 = {
      types: {
        NewQuery: {
          name: 'NewQuery',
          fields: {
            id: { type: 'String' },
            newField: { type: 'String' }
          }
        }
      }
    };
    const def3c = _.cloneDeep(def3);
    defaultSchemaConflictResolver(def3c, 'OldQuery', 'NewQuery');
    expect(def3c).to.deep.equal(def3);
  });
});
