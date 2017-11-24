import {
  GraphQLSkipInstruction,
  SchemaBacking
} from '../src/index';
import { Kind } from 'graphql';
  
const acl = {
  admin: ['create', 'read', 'update', 'delete'],
  user: ['read']
}

export const backing = new SchemaBacking()
  .Scalar('JSON')
    .serialize(value => value)
    .parseValue(value => value)
    .parseLiteral(astNode => {
      const parseLiteral = ast => {
        switch (ast.kind) {
          case Kind.STRING:
          case Kind.BOOLEAN:
            return ast.value
          case Kind.INT:
          case Kind.FLOAT:
            return parseFloat(ast.value)
          case Kind.OBJECT: {
            const value = Object.create(null)
            ast.fields.forEach(field => {
              value[field.name.value] = parseLiteral(field.value)
            })
            return value
          }
          case Kind.LIST:
            return ast.values.map(parseLiteral)
          default:
            return null
        }
      }
      return parseLiteral(astNode);
    })
  .Object('Query')
    .resolve('readFoo', (source, args) => {
      return Promise.resolve({
        id: '1',
        name: 'Foo',
        bars: []
      })
    })
  .Object('Foo')
    .resolve('bars', (source, args) => {
      console.log({source})
      return[
        { id: 'bar1', name: 'barone'},
        { id: 'bar2', name: 'bartwo'}
      ]
    })
  .Directive('remove')
    .resolveRequest((source, args, context, info) => {
      const { directives: { locations } } = info
      if (locations.FIELD && locations.FIELD.if) {
        return new GraphQLSkipInstruction();
      } else if (locations.INPUT_FIELD_DEFINITION && locations.INPUT_FIELD_DEFINITION.if) {
        return new GraphQLSkipInstruction();
      }
    })
    .resolveResult(source => {
      console.log('i shouldnt be here')
      return source
    })
  .Directive('modify')
    .resolveResult((source, args, context, info) => {
      const { directives: { locations } } = info;
      if (locations.FIELD && locations.FIELD.value) {
        return locations.FIELD.value
      } else if (locations.FIELD_DEFINITION && locations.FIELD_DEFINITION.value) {
        return locations.FIELD_DEFINITION.value
      }
    })
  .Directive('test')
    .resolveRequest((source, args, context, info) => {
      // console.log({ args })
      //console.log('REQUEST', args)
      //console.log(JSON.stringify(info.directives, null, '  '))
    })
    .resolveResult((source, args, context, info) => {
      //console.log('RESULT', args)
    })
  .Directive('acl')
    .resolveRequest((source, args, context, info) => {
      const { directives: { locations }, rootValue } = info;
      var user = rootValue ? rootValue.user : ''
      var auth = function (args) {
        return acl[user] && acl[user].indexOf(args.permission) !== -1
      }

      if (locations.SCHEMA && !auth(locations.SCHEMA)) {
        throw new Error('Unauthorized at schema')
      } else if (locations.OBJECT && !auth(locations.OBJECT)) {
        throw new Error('Unauthorized at object')
      }
    })
  .backing()
