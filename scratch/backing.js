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
    .resolveRequest((source, locations) => {
      if (locations.FIELD && locations.FIELD.args.if) {
        return new GraphQLSkipInstruction()
      }
    })
    .resolveResult(source => {
      return source
    })
  .Directive('modify')
    .resolveResult((source, locations) => {
      if (locations.FIELD && locations.FIELD.args.value) {
        return locations.FIELD.args.value
      } else if (locations.FIELD_DEFINITION && locations.FIELD_DEFINITION.args.value) {
        return locations.FIELD_DEFINITION.args.value
      }
    })
  .Directive('test')
    .resolveRequest((source, locations, context, info) => {
      console.log('REQUEST', locations)
      console.log(JSON.stringify(info.directives, null, '  '))
    })
    .resolveResult((source, locations) => {
      console.log('RESULT', locations)
      return source;
    })
  .Directive('acl')
    .resolveRequest((source, locations, context, info) => {
      var user = info.rootValue ? info.rootValue.user : ''
      var auth = function (args) {
        return acl[user] && acl[user].indexOf(args.permission) !== -1
      }

      if (locations.SCHEMA && !auth(locations.SCHEMA.args)) {
        throw new Error('Unauthorized at schema')
      } else if (locations.OBJECT && !auth(locations.OBJECT.args)) {
        throw new Error('Unauthorized at object')
      }
    })
  .backing()
