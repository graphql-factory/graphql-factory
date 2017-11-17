import {
  GraphQLSkipInstruction,
  SchemaBacking
} from '../src/index';
  
const acl = {
  admin: ['create', 'read', 'update', 'delete'],
  user: ['read']
}
  
export const backing = new SchemaBacking()
  .Object('Query')
    .resolve('readFoo', () => {
      return Promise.resolve({
        id: '1',
        name: 'Foo'
      })
    })
  .Directive('remove')
    .resolveRequest((source, args, context, info) => {
      const { directives: { locations } } = info
      if (locations.FIELD && locations.FIELD.if) {
        return new GraphQLSkipInstruction();
      }
    })
    .resolveResult(source => {
      console.logo('i shouldnt be here')
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
