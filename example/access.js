const returnType = 'User'

// fake hashing function, just do a base64 encode instead
function hash (pw) {
  return new Promise((resolve) => {
    resolve((new Buffer(pw, 'base64')).toString())
  })
}

let fields = {
  AclObject: {
    id: { type: 'String', primary: true },
    name: { type: 'String', nullable: false },
    description: { type: 'String' }
  },
  AclMutation: {
    create: {
      args: {
        name: { type: 'String', nullable: false },
        description: { type: 'String' }
      },
      resolve: 'CreateRecord'
    }
  }
}

let types = {
  User: {
    description: 'Basic user type',
    fields: {
      id: { type: 'String', primary: true },
      firstName: { type: 'String', nullable: false },
      lastName: { type: 'String', nullable: false },
      email: { type: 'String', nullable: false },
      title: { type: 'String' },
      password: { type: 'String' },
      apikey: { type: 'String' },
      disabled: { type: 'Boolean' },
      avatar: { type: 'String' },
      social: { type: 'SocialAccounts' }
    }
  },
  SocialAccounts: {
    type: ['Object', 'Input'],
    description: 'Social media accounts used for avatar display',
    fields: {
      twitter: { type: 'String' },
      facebook: { type: 'String' },
      instagram: { type: 'String' }
    }
  },
  AclRole: {
    extendFields: 'AclObject'
  },
  AclResource: {
    extendFields: 'AclObject',
    fields: {
      type: {
        Object: 'AclResourceType',
        Input: { type: 'String', nullable: false }
      }
    }
  },
  AclPermission: {
    extendFields: 'AclObject'
  },
  AclResourceType: {
    type: ['Object', 'Input'],
    extendFields: 'AclObject'
  },
  AccessMutation: {
    extendFields: {
      AclMutation: {
        create: [
          { name: 'createAclResource', type: 'AclResource', _typeName: 'AclResource' },
          { name: 'createAclRole', type: 'AclRole', _typeName: 'AclRole' },
          { name: 'createAclResourceType', type: 'AclResourceType', _typeName: 'AclResourceType' },
          { name: 'createAclPermission', type: 'AclPermission', _typeName: 'AclPermission' }
        ]
      }
    },
    fields: {
      createAclResource: {
        args: {
          type: { type: 'String', nullable: false }
        }
      }
    }
  }
}

let schemas = {
  Access: {
    query: {
      fields: {
        resources: {
          type: ['AclResource'],
          resolve: 'GetRecords',
          _typeName: 'AclResource'
        },
        roles: {
          type: ['AclRole'],
          resolve: 'GetRecords',
          _typeName: 'AclRole'
        },
        permissions: {
          type: ['AclPermission'],
          resolve: 'GetRecords',
          _typeName: 'AclPermission'
        },
        resourceTypes: {
          type: ['AclResourceType'],
          resolve: 'GetRecords',
          _typeName: 'AclResourceType'
        }
      }
    },
    mutation: 'AccessMutation'
  },
  Users: {
    query: {
      fields: {
        users: {
          type: [returnType],
          args: {
            email: 'String',
            apikey: 'String',
            disabled: 'Boolean'
          },
          resolve: 'GetUser',
          _typeName: returnType
        },
        getUserByEmail: {
          type: returnType,
          args: {
            email: 'String'
          },
          resolve: 'GetUserByEmail',
          _typeName: returnType
        },
        versioned: {
          type: [returnType],
          args: {
            id: 'String',
            version: 'String'
          },
          resolve: 'GetVersionedRecords',
          _typeName: returnType
        }
      }
    },
    mutation: {
      fields: {
        create: {
          type: returnType,
          args: {
            firstName: {type: 'String', nullable: false},
            lastName: {type: 'String', nullable: false},
            email: {type: 'String', nullable: false},
            password: {type: 'String'},
            disabled: {type: 'Boolean'},
            title: {type: 'String'},
            avatar: {type: 'String'},
            social: {type: 'SocialAccountsInput'}
          },
          resolve: 'CreateUser',
          _typeName: returnType
        },
        delete: {
          type: 'Int',
          args: {
            id: {type: 'String', nullable: false}
          },
          resolve: 'DeleteRecord',
          _typeName: returnType
        },
        purge: {
          type: 'Int',
          resolve: 'PurgeRecords',
          _typeName: returnType
        }
      }
    }
  }
}

let functions = {
  GetUser: function (source, args, context, info) {
    let { cursor, config } = this.globals.getDBConfig(this, info)
    let query = cursor.db(config.db).table(config.table)
    if (args && Object.keys(args).length) return query.filter(args).run()
    return query.run()
  },
  GetUserByEmail: function (source, args, context, info) {
    let { cursor, config } = this.globals.getDBConfig(this, info)
    return cursor.db(config.db).table(config.table).filter({
      email: args.email
    }).run().then((res) => {
      if (res.length) return res[0]
      return cursor.error('User not found')
    })
  },
  CreateUser: function (obj, args, source, info) {
    let { cursor, config } = this.globals.getDBConfig(this, info)
    return hash(args.password).then((passwordHash) => {
      return this.globals.createRecord(cursor, config, {
        id: cursor.uuid(),
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        title: args.title,
        password: passwordHash,
        disabled: Boolean(args.disabled),
        avatar: args.avatar,
        apikey: cursor.uuid(),
        social: args.social
      }, ['email']).bind(this)
    })
  }
}

export default {
  fields,
  types,
  schemas,
  functions
}
