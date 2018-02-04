import { describe, it } from 'mocha';
import { expect } from 'chai';
import { SchemaBacking } from '../backing';

const fn = () => null;

describe('definition.backing tests', function () {
  it('creates an empty backing', function () {
    const backing = new SchemaBacking();
    expect(backing.backing).to.deep.equal({
      types: {},
      directives: {}
    });

    expect(backing.validate.bind(backing)).to.throw('no type or directive ' +
    'backing configuration was found');
  });

  it('creates a backing with all types and directives', function () {
    const backing = new SchemaBacking();

    // build the backing
    backing
    .Object('FooObject')
      .resolve('readFoo', fn)
      .subscribe('readFoo', fn)
    .Object('BarObject')
      .resolve('readBar', fn)
    // add a field after other fields have been added
    .Object('FooObject')
      .resolve('listFoo', fn)
    .Scalar('FooScalar')
      .serialize(fn)
      .parseValue(fn)
      .parseLiteral(fn)
    .Interface('FooInterface')
      .resolveType(fn)
      .resolve('readIface', fn)
    .Directive('test')
      .resolve(fn)
      .resolveResult(fn)
      .beforeBuild(fn);
    expect(backing.backing).to.deep.equal({
      types: {
        FooObject: {
          fields: {
            readFoo: {
              resolve: fn,
              subscribe: fn
            },
            listFoo: {
              resolve: fn
            }
          }
        },
        BarObject: {
          fields: {
            readBar: {
              resolve: fn
            }
          }
        },
        FooScalar: {
          serialize: fn,
          parseValue: fn,
          parseLiteral: fn
        },
        FooInterface: {
          resolveType: fn,
          fields: {
            readIface: {
              resolve: fn
            }
          }
        }
      },
      directives: {
        test: {
          resolve: fn,
          resolveResult: fn,
          beforeBuild: fn
        }
      }
    });
  });

  it('creates a backing from an object and merges', function () {
    const typeDef = {
      types: {
        Foo: {
          fields: {
            readFoo: {
              resolve: fn
            }
          }
        }
      }
    };

    const dirDef = {
      directives: {
        test: {
          resolve: fn
        }
      }
    };

    const backing = new SchemaBacking(typeDef);
    expect(backing.backing.types).to.deep.equal(typeDef.types);
    backing.merge(dirDef);
    expect(backing.backing).to.deep.equal(Object.assign({}, typeDef, dirDef));
  });

  it('exports a resolverMap', function () {
    const backing = new SchemaBacking();
    backing
    .Object('Foo')
      .resolve('readFoo', fn)
      .resolve('listFoo', fn)
    .Object('Bar')
      .resolve('readBar', fn)
    .Interface('Iface')
      .resolve('readIface', fn)
    .Scalar('FooScalar')
      .serialize(fn);

    expect(backing.export('resolverMap')).to.deep.equal({
      Foo: {
        readFoo: fn,
        listFoo: fn
      },
      Bar: {
        readBar: fn
      },
      Iface: {
        readIface: fn
      }
    });
  });

  it('adds an enum backing', function () {
    const backing = new SchemaBacking();
    backing
      .Enum('FooEnum')
        .value('BAR', 1)
        .value('BAZ', 2)
      .backing
    expect(backing.enums).to.deep.equal({
      FooEnum: {
        BAR: 1,
        BAZ: 2
      }
    })
  });
});
