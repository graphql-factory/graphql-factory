import {
  parse,
  subscribe,
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString
} from 'graphql';
import rdash from 'rethinkdbdash'
import { AsyncIterator } from '../src/jsutils/asyncIterator'
import { request } from '../src/utilities/request'
import { forAwaitEach, isAsyncIterable } from 'iterall'

const r = rdash({ silent: true })

function prettyPrint(obj) {
  console.log(JSON.stringify(obj, null, '  '))
}

export const Foo = new GraphQLObjectType({
  name: 'Foo',
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString }
  }
})

export const Query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    readFoo: {
      type: Foo,
      args: {
        id: { type: GraphQLString }
      },
      resolve (source, args, context, info) {
        return r.table('foo').get(args.id).run();
      }
    }
  }
})

export const Subscription = new GraphQLObjectType({
  name: 'Subscription',
  fields: {
    subscribeFoo: {
      type: Foo,
      args: {
        id: { type: GraphQLString }
      },
      resolve (source, args, context, info) {
        return r.table('foo').get(source.id).run()
      },
      subscribe: (source, args, context, info) => {
        try {
          const array = [];
          const iterator = AsyncIterator.fromArray(array);
  
          r.table('foo').get(args.id).changes()('new_val').run()
          .then(cursor => {
            cursor.each((err, data) => {
              if (err) {
                return iterator.throw(err);
              }
              array.push(data)
            })
          }, err => {
            console.log(err)
          })
          return iterator
        } catch (err) {
          console.log(err)
        }
      }
    }
  }
})

export const schema = new GraphQLSchema({
  query: Query,
  subscription: Subscription
})

const fooQuery = `
query FooQuery {
  readFoo(id: "1") {
    id,
    name
  }
}
`

const fooSubscribe = `
subscription FooSubscribe {
  subscribeFoo(id: "1") {
    id,
    name
  }
}
`
/*
graphql(schema, fooQuery)
.then(prettyPrint)
.catch(console.error)
.finally(() => {
  r.getPoolMaster().drain()
})
*/

request(schema, fooSubscribe)
.then(iterator => {
  forAwaitEach(iterator, result => {
    console.log(result)
  })
})
.catch(err => {
  console.log(err)
})

/*
const iter = new AsyncIterator();

r.table('foo').changes()('new_val').run().then(cursor => {
  cursor.each((err, data) => {
    if (err) {
      return iter.iterator.throw(err)
    }
    iter.push(data)
  })
})

forAwaitEach(iter.iterator, result => {
  console.log(result)
})
*/