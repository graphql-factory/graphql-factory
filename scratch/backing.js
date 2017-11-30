import {
  GraphQLSkipInstruction,
  SchemaBacking
} from '../src/index';
import { Kind } from 'graphql';
  
const acl = {
  admin: ['create', 'read', 'update', 'delete'],
  user: ['read']
}

const db = {
  categories: [
    { id: '1', name: 'Food' },
    { id: '2', name: 'Health' },
    { id: '3', name: 'Entertainment' }
  ],
  list: [
    { id: '1', name: 'Shopping', items: ['1', '2', '3'] },
    { id: '2', name: 'Christmas', items: ['7', '8'] }
  ],
  item: [
    { id: '1', name: 'Bananas', category: '1' },
    { id: '2', name: 'Apples', category: '1' },
    { id: '3', name: 'Milk', category: '1' },
    { id: '4', name: 'Toothpaste', category: '2' },
    { id: '5', name: 'Shampoo', category: '2' },
    { id: '6', name: 'Movie Tickets', category: '3' },
    { id: '7', name: 'Legos', category: '2' },
    { id: '8', name: 'Jump Rope', category: '2' }
  ]
}

function nextId(table) {
  return String(db[table].length + 1);
}

function find(table, key, value) {
  const results = db[table].filter(record => {
    return record[key] === value
  })
  return results.length ? results[0] : null
}

export const shoppingBacking = new SchemaBacking()
.Directive('test')
.resolveRequest((source, args, context, info) => {
  console.log('REQUEST', info)
  //console.log(JSON.stringify(info.directives, null, '  '))
})
.resolveResult((source, args, context, info) => {
  // console.log('RESULT', args)
})
.Object('Mutation')
.resolve('createList', (source, args, context, info) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('Creating list')
      const id = nextId('list')
      const list = {
        id,
        name: args.name,
        items: args.items.reduce((items, item) => {
          const { name, category } = item
          const _item = find('item', 'name', name)
          let _cate = find('categories', 'name', category.name)
    
          if (!_cate) {
            const cateId = nextId('categories')
            _cate = {
              id: cateId,
              name: category.name
            }
            db.categories.push(_cate)
          }
    
          if (!_item) {
            const itemId = nextId('item')
            const newItem = {
              id: itemId,
              name,
              category: _cate.id
            }
            db.item.push(newItem)
            items.push(itemId)
          } else {
            items.push(_item.id)
          }
          return items
        }, [])
      }
    
      db.list.push(list)
      return resolve(list)
    }, 2000)
  })
})
.Object('Query')
.resolve('listLists', (source, args, context, info) => {
  if (args.search) {
    return db.list.filter(list => {
      return list.name.match(new RegExp(args.search, 'i'));
    })
  }

  return db.list
})
.resolve('readList', (source, args, context, info) => {
  // throw new Error('ahhh')
  const results = db.list.filter(list => {
    return list.id === args.id
  })
  return results.length ? results[0] : null
})
.Object('List')
.resolve('items', (source, args, context, info) => {
  //console.log(info.parentType)
  if (source) {
    return db.item.filter(item => {
      return source.items.indexOf(item.id) !== -1
    })
  }
  return db.item
})
.Object('Item')
.resolve('category', (source, args, context, info) => {
  // throw new Error('test')
  // console.log('========')
  // console.log(info)
  //console.log(info.parentType)
  if (source) {
    source.name = source.name
    const res = db.categories.filter(c => {
      return c.id === source.category
    })
    return res.length ? res[0] : null;
  }
  return db.categories
})
.backing()

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
    .resolve('readFoo', (source, args, context, info) => {
      return Promise.resolve({
        id: '1',
        name: 'Foo',
        bars: []
      })
    })
    .resolve('listFoo', (source, args, context, info) => {
      return Promise.resolve([
        { id: '1', name: 'Foo1', bars: [] },
        { id: '2', name: 'Foo2', bars: [] }
      ])
    })
  .Object('Foo')
    .resolve('bars', (source, args, context, info) => {
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
