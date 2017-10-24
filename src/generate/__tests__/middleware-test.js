import { describe, it } from 'mocha'
import { expect } from 'chai'
import Middleware from '../../definition/middleware'
import middleware from '../middleware'
import {
  BEFORE_MIDDLEWARE,
  AFTER_MIDDLEWARE,
  ERROR_MIDDLEWARE
} from '../../common/const'

describe('generate.middleware tests', () => {
  it('pass through with no middleware', () => {
    const def = { _before: [], _after: [], _error: [] }
    const ctx = {}
    const params = { source: null, args: {}, context: {}, info: {} }
    const resolver = function () {
      return true
    }

    return middleware(def, resolver, ctx, params)
      .then(result => {
        expect(result).to.equal(true)
      })
  })

  it('modifies arguments in before', () => {
    const _before = [
      new Middleware(
        BEFORE_MIDDLEWARE,
        function (params, next) {
          const { args } = params
          args.value = true
          next()
        }
      )
    ]
    const def = { _before, _after: [], _error: [] }
    const ctx = {}
    const params = { source: null, args: { value: false }, context: {}, info: {} }
    const resolver = function (source, args) {
      return args
    }

    return middleware(def, resolver, ctx, params)
      .then(result => {
        expect(result).to.deep.equal({ value: true })
      })
  })

  it('modifies a result in after', () => {
    const _after = [
      new Middleware(
        AFTER_MIDDLEWARE,
        function (params, result, next) {
          result.value = true
          next(undefined, result)
        }
      )
    ]
    const def = { _before: [], _after, _error: [] }
    const ctx = {}
    const params = { source: null, args: {}, context: {}, info: {} }
    const resolver = function () {
      return {}
    }

    return middleware(def, resolver, ctx, params)
      .then(result => {
        expect(result).to.deep.equal({ value: true })
      })
  })

  it('modifies an error in error', () => {
    const _error = [
      new Middleware(
        ERROR_MIDDLEWARE,
        function (params, error, next) {
          const newError = new Error('updated ' + error.message)
          next(newError)
        }
      )
    ]
    const def = { _before: [], _after: [], _error }
    const ctx = {}
    const params = { source: null, args: {}, context: {}, info: {} }
    const resolver = function () {
      return Promise.reject(new Error('resolver error'))
    }

    return middleware(def, resolver, ctx, params)
      .then(result => {
        return result
      })
      .catch(error => {
        expect(error).to.be.an.instanceOf(Error)
        expect(error.message).to.equal('updated resolver error')
      })
  })

  it('modifies before and after multiple times', () => {
    const def = {
      _before: [
        new Middleware(
          BEFORE_MIDDLEWARE,
          function (params, next) {
            const { args } = params
            args.value1 = 1
            next()
          }
        ),
        new Middleware(
          BEFORE_MIDDLEWARE,
          function (params, next) {
            const { args } = params
            args.value2 = 2
            next()
          }
        )
      ],
      _after: [
        new Middleware(
          AFTER_MIDDLEWARE,
          function (params, result, next) {
            const { args } = params
            result.sum1 = args.value1 + args.value2
            return next(undefined, result)
          }
        ),
        new Middleware(
          AFTER_MIDDLEWARE,
          function (params, result, next) {
            result.sum2 = result.sum1 + 1
            return next(undefined, result)
          }
        )
      ],
      _error: []
    }
    const ctx = {}
    const params = { source: null, args: {}, context: {}, info: {} }
    const resolver = function (source, args) {
      return args
    }

    return middleware(def, resolver, ctx, params)
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
    const def = {
      _before: [
        new Middleware(
          BEFORE_MIDDLEWARE,
          function (params, next) {
            const { args } = params
            args.value1 = 1
            next()
          }
        ),
        new Middleware(
          BEFORE_MIDDLEWARE,
          function (params, next) {
            next(new Error('failed before'))
          }
        )
      ],
      _after: [],
      _error: [
        new Middleware(
          ERROR_MIDDLEWARE,
          function (params, error, next) {
            const newError = new Error('updated1 ' + error.message)
            next(newError)
          }
        ),
        new Middleware(
          ERROR_MIDDLEWARE,
          function (params, error, next) {
            const newError = new Error('updated2 ' + error.message)
            next(newError)
          }
        )
      ]
    }
    const ctx = {}
    const params = { source: null, args: {}, context: {}, info: {} }
    const resolver = function (source, args) {
      return args
    }

    return middleware(def, resolver, ctx, params)
      .then(result => {
        return result
      })
      .catch(error => {
        expect(error).to.be.an.instanceOf(Error)
        expect(error.message).to.equal('updated2 updated1 failed before')
      })
  })

  it('fails in after', () => {
    const def = {
      _before: [],
      _after: [
        new Middleware(
          AFTER_MIDDLEWARE,
          function (params, result, next) {
            next(undefined, result)
          }
        ),
        new Middleware(
          AFTER_MIDDLEWARE,
          function (params, result, next) {
            next(new Error('failed after'))
          }
        )
      ],
      _error: []
    }
    const ctx = {}
    const params = { source: null, args: {}, context: {}, info: {} }
    const resolver = function (source, args) {
      return args
    }

    return middleware(def, resolver, ctx, params)
      .then(result => {
        return result
      })
      .catch(error => {
        expect(error).to.be.an.instanceOf(Error)
        expect(error.message).to.equal('failed after')
      })
  })

  it('resolver called with generated context', () => {
    const def = { _before: [], _after: [], _error: [] }
    const ctx = { ctx: true }
    const params = { source: null, args: {}, context: {}, info: {} }
    const resolver = function () {
      return this
    }

    return middleware(def, resolver, ctx, params)
      .then(result => {
        expect(result).to.deep.equal({ ctx: true })
      })
  })

  it('catches errors in middleware', () => {
    const _before = [
      new Middleware(
        BEFORE_MIDDLEWARE,
        function () {
          throw new Error('threw in before')
        }
      )
    ]
    const def = { _before, _after: [], _error: [] }
    const ctx = {}
    const params = { source: null, args: { value: false }, context: {}, info: {} }
    const resolver = function (source, args) {
      return args
    }

    return middleware(def, resolver, ctx, params)
      .then(result => {
        return result
      })
      .catch(error => {
        expect(error).to.be.an.instanceOf(Error)
        expect(error.message).to.equal('threw in before')
      })
  })
})
