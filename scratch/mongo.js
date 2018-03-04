import {
  SchemaDefinition,
  mapDirectives
} from '../src';
import _ from 'lodash';
import MongoosePlugin from './mongo-plugin';
import mongoose from 'mongoose';
import {
  buildSchema,
  GraphQLScalarType,
  graphql,
  DirectiveLocation
} from 'graphql';

const defaultConnection = mongoose.createConnection('mongodb://localhost/test');

const plugin = new MongoosePlugin({
  test: defaultConnection
});

const def = {
  types: {
    Foo: {
      type: 'Object',
      fields: {
        id: { type: 'ID!', '@directives': { id: true } },
        name: { type: 'String!' },
        bar: {
          type: 'Bar',
          resolve(...args) {
            return plugin._functions.mongooseRelationResolver(...args);
          }
        }
      },
      '@directives': [
        {
          name: 'mongoose',
          args: {
            collection: 'foo'
          }
        }
      ]
    },
    Bar: {
      type: 'Object',
      fields: {
        id: { type: 'ID!', '@directives': { id: true }  },
        name: { type: 'String!' }
      },
      '@directives': [
        {
          name: 'mongoose',
          args: {
            collection: 'bar'
          }
        }
      ]
    },
    Query: {
      type: 'Object',
      fields: {
        findOneFoo: {
          type: 'Foo',
          args: { filter: 'JSON!' },
          resolve(...args) {
            console.log('factory', args[0], args[1], args[3].path)
            return plugin._functions.mongooseFindOneResolver(...args);
          }
        }
      }
    }
  },
  schema: {
    query: 'Query',
    '@directives': {
      test: {
        value: '@@@@@@@ schema directive'
      }
    }
  }
};

const schemaDef = `
scalar JSON
input CreateFooInput {
  name: String!
  bar: String
}
input UpdateFooInput {
  name: String
  bar: String
}
type Foo @mongoose(collection: "foo") {
  id: ID! @id
  name: String! @unique
  bar: Bar @resolve(resolver:"mongooseRelationResolver")
}
type Bar @mongoose(collection: "bar") {
  id: ID! @id
  name: String! @unique @relation(type:"Foo", field:"bar")
}
type Query {
  findOneFoo(filter:JSON!): Foo @resolve(resolver:"mongooseFindOneResolver")
}
schema {
  query: Query
}
`;

const source = `
query HI {
  findOneFoo (filter:{ name:"baz"}) {
    id
    name
    bar {
      id
      name
    }
  }
  findOneFoo (filter:{ name:"baz"}) {
    id
    name
    car:bar {
      id
      name
    }
  }
}`

export const JSONType = new GraphQLScalarType({
  type: 'Scalar',
  name: 'JSON',
  description: 'The `JSON` scalar type represents JSON values as ' +
  'specified by [ECMA-404](http://www.ecma-international.org/' +
  'publications/files/ECMA-ST/ECMA-404.pdf).',
  serialize: value => value,
  parseValue: value => value,
  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.STRING:
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.INT:
      case Kind.FLOAT:
        return parseFloat(ast.value);
      case Kind.OBJECT: {
        return ast.fields.reduce((value, field) => {
          value[field.name.value] = parseLiteral(field.value);
          return value;
        }, Object.create(null));
      }
      case Kind.LIST:
        return ast.values.map(parseLiteral);
      default:
        return null;
    }
  }
});

const gschema = buildSchema(schemaDef);

const definition = new SchemaDefinition()
  .use(plugin)
  .use({
    directives: {
      ...mapDirectives([ 'unique', 'resolve', 'id' ]),
      test: {
        name: 'test',
        locations: _.values(DirectiveLocation),
        args: {
          value: { type: 'String!' }
        },
        before(source, args, context, info) {
          console.log(args.value);
        }
      }
    }
  })
  .use(def);
  // .use(schemaDef);

const schema = definition.buildSchema();

schema.request({ source }).then(result => {
  console.log('--Factory Execution--');
  console.log(JSON.stringify(result.data, null, '  '));
  gschema.getType('Query')
    .getFields()
    .findOneFoo
    .resolve = (...args) => {
      console.log('native', args[0], args[1], args[3].path)
      return plugin._functions.mongooseFindOneResolver(...args);
    }
  gschema.getType('Foo')
    .getFields()
    .bar
    .resolve = (...args) => {
      return plugin._functions.mongooseRelationResolver(...args);
    }
  gschema.getTypeMap().JSON = JSONType;
})
.then(() => {
  return graphql({ schema: gschema, source })
    .then(res => {
      console.log('---Native GraphQL Execution--');
      console.log(JSON.stringify(res.data, null, '  '))
    })
})
.then(() => {
  defaultConnection.close();
})
.catch(err => {
  console.log(err);
  defaultConnection.close();
});
