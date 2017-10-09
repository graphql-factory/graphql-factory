export default {
  types: {
    User: {
      fields: {
        id: { type: 'String', primary: true },
        name: 'String',
        email: 'String'
      }
    }
  },
  schemas: {
    Users: {
      query: {
        fields: {
          listUsers: {
            type: ['User'],
            resolve (source, args, context, info) {
              console.log('RES', this.fieldDef)
              return [{id: '1', name: 'John', email: 'John@aol.com'}]
            },
            _blah: true
          }
        }
      }
    }
  }
}