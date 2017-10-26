import { describe, it } from 'mocha'
import { expect } from 'chai'
import * as graphql from 'graphql'
import EventEmitter from 'events'
import Definition from '../../definition/definition'
import Generator from '../generate'
import middleware from '../middleware'
import {
  EVENT_REQUEST,
  EVENT_ERROR
} from '../../common/const'
const DEBUG = false
const factory = new EventEmitter()

/* eslint-disable */
if (DEBUG) {
  factory
    .on(EVENT_REQUEST, data => {
      console.log(data)
      console.log(data.metrics.executions)
    })
    .on(EVENT_ERROR, err => {
      console.error(err)
    })
}
/* eslint-enable */

describe('generate.middleware tests', () => {
  it('pass through with no middleware', () => {
    const def = new Definition(factory)
    const req = { source: null, args: {}, context: {}, info: {} }
    const resolver = function passthroughResolve () {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(true)
        }, 10)
      })
    }
    const generator = new Generator(graphql).generate(def)
    return middleware(generator, resolver, req)
      .then(result => {
        expect(result).to.equal(true)
      })
  })

  it('modifies arguments in before', () => {
    const def = new Definition(factory)
      .before(
        function beforeMw (req, res, next) {
          const { args } = req
          args.value = true
          return next()
        }
      )
    const generator = new Generator(graphql).generate(def)
    const req = { source: null, args: {}, context: {}, info: {} }
    const resolver = function (source, args) {
      return args
    }

    return middleware(generator, resolver, req)
      .then(result => {
        expect(result).to.deep.equal({ value: true })
      })
  })

  it('modifies a result in after', () => {
    const def = new Definition(factory)
      .after(
        function afterMw (req, res, next) {
          req.result.value = true
          return next()
        }
      )
    const generator = new Generator(graphql).generate(def)
    const req = { source: null, args: {}, context: {}, info: {} }
    const resolver = function () {
      return {}
    }

    return middleware(generator, resolver, req)
      .then(result => {
        expect(result).to.deep.equal({ value: true })
      })
  })

  it('modifies an error in error', () => {
    const def = new Definition(factory)
      .error(
        function errorMw (req, res, next) {
          const newError = new Error('updated ' + req.error.message)
          next(newError)
        }
      )
    const generator = new Generator(graphql).generate(def)
    const req = { source: null, args: {}, context: {}, info: {} }
    const resolver = function () {
      return Promise.reject(new Error('resolver error'))
    }

    return middleware(generator, resolver, req)
      .then(result => {
        return result
      })
      .catch(error => {
        expect(error).to.be.an.instanceOf(Error)
        expect(error.message).to.equal('updated resolver error')
      })
  })

  it('modifies before and after multiple times', () => {
    const def = new Definition(factory)
      .before(
        function before1 (req, res, next) {
          const { args } = req
          args.value1 = 1
          setTimeout(next, 10)
        }
      )
      .before(
        function before2 (req, res, next) {
          const { args } = req
          args.value2 = 2
          setTimeout(next, 10)
        }
      )
      .after(
        function after1 (req, res, next) {
          const { args } = req
          req.result.sum1 = args.value1 + args.value2
          setTimeout(next, 10)
        }
      )
      .after(
        function (req, res, next) {
          req.result.sum2 = req.result.sum1 + 1
          setTimeout(next, 10)
        }
      )
    const generator = new Generator(graphql).generate(def)
    const req = { source: null, args: {}, context: {}, info: {} }
    const resolver = function (source, args) {
      return args
    }

    return middleware(generator, resolver, req)
      .then(result => {
        expect(result).to.deep.equal({
          value1: 1,
          value2: 2,
          sum1: 3,
          sum2: 4
        })
      })
  })

  it('fails in before and updates error twice', () => {
    const def = new Definition(factory)
      .before(
        function (req, res, next) {
          const { args } = req
          args.value1 = 1
          next()
        }
      )
      .before(
        function (req, res, next) {
          next(new Error('failed before'))
        }
      )
      .error(
        function (req, res, next) {
          req.error = new Error('updated1 ' + req.error.message)
          next()
        }
      )
      .error(
        function (req, res, next) {
          req.error = new Error('updated2 ' + req.error.message)
          next()
        }
      )

    const generator = new Generator(graphql).generate(def)
    const req = { source: null, args: {}, context: {}, info: {} }
    const resolver = function (source, args) {
      return args
    }

    return middleware(generator, resolver, req)
      .then(result => {
        return result
      })
      .catch(error => {
        expect(error).to.be.an.instanceOf(Error)
        expect(error.message).to.equal('updated2 updated1 failed before')
      })
  })

  it('fails in after', () => {
    const def = new Definition(factory)
      .after(
        function (req, res, next) {
          next()
        }
      )
      .after(
        function (req, res, next) {
          next(new Error('failed after'))
        }
      )

    const generator = new Generator(graphql).generate(def)
    const req = { source: null, args: {}, context: {}, info: {} }
    const resolver = function (source, args) {
      return args
    }

    return middleware(generator, resolver, req)
      .then(result => {
        return result
      })
      .catch(error => {
        expect(error).to.be.an.instanceOf(Error)
        expect(error.message).to.equal('failed after')
      })
  })

  it('catches errors in middleware', () => {
    const def = new Definition(factory)
      .before(
        function () {
          throw new Error('threw in before')
        }
      )

    const generator = new Generator(graphql).generate(def)
    const req = { source: null, args: { value: false }, context: {}, info: {} }
    const resolver = function (source, args) {
      return args
    }

    return middleware(generator, resolver, req)
      .then(result => {
        return result
      })
      .catch(error => {
        expect(error).to.be.an.instanceOf(Error)
        expect(error.message).to.equal('threw in before')
      })
  })

  it('can route to the resolver', () => {
    const def = new Definition(factory)
      .after(
        function afterResolver (req, res, next) {
          return req.result < 3
            ? next('resolve')
            : next()
        }
      )

    const generator = new Generator(graphql).generate(def)
    const req = { source: null, args: { value: false }, context: {}, info: {} }
    const resolver = function () {
      if (!this.req.result) return 1
      return this.req.result + 1
    }

    return middleware(generator, resolver, req)
      .then(result => {
        expect(result).to.equal(3)
      })
  })
})
