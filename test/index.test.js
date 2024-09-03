'use strict'

const { test } = require('node:test')
const Fastify = require('fastify')
const basicAuth = require('..')
const fastifyAuth = require('@fastify/auth')

test('Basic', async t => {
  t.plan(2)

  const fastify = Fastify()
  await fastify.register(basicAuth, { validate })

  async function validate (username, password, req, res) {
    if (username !== 'user' && password !== 'pwd') {
      return new Error('Unauthorized')
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  })

  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 200)
})

test('Basic utf8: true', async t => {
  t.plan(2)

  const fastify = Fastify()
  fastify.register(basicAuth, { validate, utf8: true })

  function validate (username, password, req, res, done) {
    if (username === 'test' && password === '123\u00A3') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      /**
       * @see https://datatracker.ietf.org/doc/html/rfc7617#section-2.1
       */
      authorization: 'Basic dGVzdDoxMjPCow=='
    }
  })

  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 200)
})

test('Basic - 401, sending utf8 credentials base64 but utf8: false', async t => {
  t.plan(3)

  const fastify = Fastify()
  fastify.register(basicAuth, { validate, utf8: false })

  function validate (username, password, req, res, done) {
    if (username === 'test' && password === '123\u00A3') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      /**
      * @see https://datatracker.ietf.org/doc/html/rfc7617#section-2.1
      */
      authorization: 'Basic dGVzdDoxMjPCow=='
    }
  })

  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 401)
  t.assert.deepStrictEqual(JSON.parse(body), {
    error: 'Unauthorized',
    message: 'Unauthorized',
    statusCode: 401
  })
})

test('Basic - 401', async t => {
  t.plan(3)

  const fastify = Fastify()
  fastify.register(basicAuth, { validate })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Winter is coming'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwdd')
    }
  })
  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 401)
  t.assert.deepStrictEqual(JSON.parse(body), {
    error: 'Unauthorized',
    message: 'Winter is coming',
    statusCode: 401
  })
})

test('Basic - Invalid Header value /1', async t => {
  t.plan(3)

  const fastify = Fastify()
  fastify.register(basicAuth, { validate })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Winter is coming'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: 'Bearer ' + Buffer.from('user:pass').toString('base64')
    }
  })
  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 401)
  t.assert.deepStrictEqual(JSON.parse(body), {
    code: 'FST_BASIC_AUTH_MISSING_OR_BAD_AUTHORIZATION_HEADER',
    error: 'Unauthorized',
    message: 'Missing or bad formatted authorization header',
    statusCode: 401
  })
})

test('Basic - Invalid Header value /2', async t => {
  t.plan(3)

  const fastify = Fastify()
  fastify.register(basicAuth, { validate })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Winter is coming'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: 'Basic ' + Buffer.from('user').toString('base64')
    }
  })
  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 401)
  t.assert.deepStrictEqual(JSON.parse(body), {
    code: 'FST_BASIC_AUTH_MISSING_OR_BAD_AUTHORIZATION_HEADER',
    error: 'Unauthorized',
    message: 'Missing or bad formatted authorization header',
    statusCode: 401
  })
})

test('Basic - Invalid Header value /3', async t => {
  t.plan(3)

  const fastify = Fastify()
  fastify.register(basicAuth, { validate })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Winter is coming'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: 'Basic ' + Buffer.from('user\x00:pwd').toString('base64')
    }
  })
  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 401)
  t.assert.deepStrictEqual(JSON.parse(body), {
    code: 'FST_BASIC_AUTH_MISSING_OR_BAD_AUTHORIZATION_HEADER',
    error: 'Unauthorized',
    message: 'Missing or bad formatted authorization header',
    statusCode: 401
  })
})

test('Basic - strictCredentials: false', async t => {
  t.plan(2)

  const fastify = Fastify()
  fastify.register(basicAuth, { validate, strictCredentials: false })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Winter is coming'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: '      Basic ' + Buffer.from('user:pwd').toString('base64')
    }
  })
  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 200)
})

test('Basic with promises', async t => {
  t.plan(2)

  const fastify = Fastify()
  fastify.register(basicAuth, { validate })

  function validate (username, password, req, res) {
    if (username === 'user' && password === 'pwd') {
      return Promise.resolve()
    } else {
      return Promise.reject(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  })
  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 200)
})

test('Basic with promises - 401', async t => {
  t.plan(3)

  const fastify = Fastify()
  fastify.register(basicAuth, { validate })

  function validate (username, password, req, res) {
    if (username === 'user' && password === 'pwd') {
      return Promise.resolve()
    } else {
      return Promise.reject(new Error('Winter is coming'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwdd')
    }
  })
  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 401)
  t.assert.deepStrictEqual(JSON.parse(body), {
    error: 'Unauthorized',
    message: 'Winter is coming',
    statusCode: 401
  })
})

test('WWW-Authenticate (authenticate: true)', async t => {
  t.plan(6)

  const fastify = Fastify()
  const authenticate = true
  fastify.register(basicAuth, { validate, authenticate, utf8: false })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const res1 = await fastify.inject({
    url: '/',
    method: 'GET'
  })
  t.assert.ok(res1.body)
  t.assert.strictEqual(res1.headers['www-authenticate'], 'Basic')
  t.assert.strictEqual(res1.statusCode, 401)

  const res2 = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  })
  t.assert.ok(res2.body)
  t.assert.strictEqual(res2.headers['www-authenticate'], undefined)
  t.assert.strictEqual(res2.statusCode, 200)
})

test('WWW-Authenticate (authenticate: false)', async t => {
  t.plan(6)

  const fastify = Fastify()
  const authenticate = false
  fastify.register(basicAuth, { validate, authenticate, utf8: false })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const res1 = await fastify.inject({
    url: '/',
    method: 'GET'
  })
  t.assert.ok(res1.body)
  t.assert.strictEqual(res1.headers['www-authenticate'], undefined)
  t.assert.strictEqual(res1.statusCode, 401)

  const res2 = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  })
  t.assert.ok(res2.body)
  t.assert.strictEqual(res2.headers['www-authenticate'], undefined)
  t.assert.strictEqual(res2.statusCode, 200)
})

test('WWW-Authenticate Realm (authenticate: {realm: "example"}, utf8: false)', async t => {
  t.plan(6)

  const fastify = Fastify()
  const authenticate = { realm: 'example' }
  fastify.register(basicAuth, { validate, authenticate, utf8: false })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const res1 = await fastify.inject({
    url: '/',
    method: 'GET'
  })
  t.assert.ok(res1.body)
  t.assert.strictEqual(res1.headers['www-authenticate'], 'Basic realm="example"')
  t.assert.strictEqual(res1.statusCode, 401)

  const res2 = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  })
  t.assert.ok(res2.body)
  t.assert.strictEqual(res2.headers['www-authenticate'], undefined)
  t.assert.strictEqual(res2.statusCode, 200)
})

test('WWW-Authenticate Realm (authenticate: {realm: "example"}, utf8: true)', async t => {
  t.plan(6)

  const fastify = Fastify()
  const authenticate = { realm: 'example' }
  fastify.register(basicAuth, { validate, authenticate, utf8: true })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const res1 = await fastify.inject({
    url: '/',
    method: 'GET'
  })
  t.assert.ok(res1.body)
  t.assert.strictEqual(res1.headers['www-authenticate'], 'Basic realm="example", charset="UTF-8"')
  t.assert.strictEqual(res1.statusCode, 401)

  const res2 = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  })
  t.assert.ok(res2.body)
  t.assert.strictEqual(res2.headers['www-authenticate'], undefined)
  t.assert.strictEqual(res2.statusCode, 200)
})

test('Header option specified', async t => {
  t.plan(2)

  const fastify = Fastify()
  fastify.register(basicAuth, {
    validate,
    header: 'X-Forwarded-Authorization'
  })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('notuser', 'notpwd'),
      'x-forwarded-authorization': basicAuthHeader('user', 'pwd')
    }
  })
  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 200)
})

test('Missing validate function', async t => {
  t.plan(2)

  const fastify = Fastify()
  fastify.register(basicAuth)

  await t.assert.rejects(
    async () => fastify.ready(),
    (err) => {
      t.assert.strictEqual(err.message, 'Basic Auth: Missing validate function')
      return true
    }
  )
})

test('Hook - 401', async t => {
  t.plan(3)

  const fastify = Fastify()
  fastify
    .register(basicAuth, { validate })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Winter is coming'))
    }
  }

  fastify.after(() => {
    fastify.addHook('preHandler', fastify.basicAuth)
    fastify.route({
      method: 'GET',
      url: '/',
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwdd')
    }
  })
  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 401)
  t.assert.deepStrictEqual(JSON.parse(body), {
    error: 'Unauthorized',
    message: 'Winter is coming',
    statusCode: 401
  })
})

test('With @fastify/auth - 401', async t => {
  t.plan(3)

  const fastify = Fastify()
  fastify
    .register(fastifyAuth)
    .register(basicAuth, { validate })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Winter is coming'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.auth([fastify.basicAuth]),
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwdd')
    }
  })
  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 401)
  t.assert.deepStrictEqual(JSON.parse(body), {
    error: 'Unauthorized',
    message: 'Winter is coming',
    statusCode: 401
  })
})

test('Hook with @fastify/auth- 401', async t => {
  t.plan(3)

  const fastify = Fastify()
  fastify
    .register(fastifyAuth)
    .register(basicAuth, { validate })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Winter is coming'))
    }
  }

  fastify.after(() => {
    fastify.addHook('preHandler', fastify.auth([fastify.basicAuth]))
    fastify.route({
      method: 'GET',
      url: '/',
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwdd')
    }
  })
  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 401)
  t.assert.deepStrictEqual(JSON.parse(body), {
    error: 'Unauthorized',
    message: 'Winter is coming',
    statusCode: 401
  })
})

test('Missing header', async t => {
  t.plan(3)

  const fastify = Fastify()
  fastify.register(basicAuth, { validate })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET'
  })
  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 401)
  t.assert.deepStrictEqual(JSON.parse(body), {
    statusCode: 401,
    code: 'FST_BASIC_AUTH_MISSING_OR_BAD_AUTHORIZATION_HEADER',
    error: 'Unauthorized',
    message: 'Missing or bad formatted authorization header'
  })
})

test('Fastify context', async t => {
  t.plan(3)

  const fastify = Fastify()
  fastify.decorate('test', true)
  fastify.register(basicAuth, { validate })

  function validate (username, password, req, res, done) {
    t.assert.ok(this.test)
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  })
  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 200)
})

test('setErrorHandler custom error and 401', async t => {
  t.plan(4)

  const fastify = Fastify()
  fastify
    .register(fastifyAuth)
    .register(basicAuth, { validate })

  function validate (username, password, req, res, done) {
    done(new Error('Winter is coming'))
  }

  fastify.after(() => {
    fastify.addHook('preHandler', fastify.auth([fastify.basicAuth]))
    fastify.route({
      method: 'GET',
      url: '/',
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  fastify.setErrorHandler(function (err, req, reply) {
    t.assert.strictEqual(err.statusCode, 401)
    reply.send(err)
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwdd')
    }
  })
  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 401)
  t.assert.deepStrictEqual(JSON.parse(body), {
    error: 'Unauthorized',
    message: 'Winter is coming',
    statusCode: 401
  })
})

test('Missing header and custom error handler', async t => {
  t.plan(6)

  const fastify = Fastify()
  fastify.register(basicAuth, { validate })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  fastify.setErrorHandler(function (err, req, reply) {
    t.assert.ok(err instanceof Error)
    t.assert.ok(err.statusCode === 401)
    t.assert.ok(err.code === 'FST_BASIC_AUTH_MISSING_OR_BAD_AUTHORIZATION_HEADER')
    reply.send(err)
  })

  const { statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET'
  })
  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 401)
  t.assert.deepStrictEqual(JSON.parse(body), {
    statusCode: 401,
    code: 'FST_BASIC_AUTH_MISSING_OR_BAD_AUTHORIZATION_HEADER',
    error: 'Unauthorized',
    message: 'Missing or bad formatted authorization header'
  })
})

test('Invalid options (authenticate)', async t => {
  t.plan(2)

  const fastify = Fastify()
  fastify
    .register(basicAuth, { validate, authenticate: 'i am invalid' })

  async function validate (username, password, req, res) {
    if (username !== 'user' && password !== 'pwd') {
      return new Error('Unauthorized')
    }
  }

  await t.assert.rejects(
    async () => fastify.ready(),
    (err) => {
      t.assert.strictEqual(err.message, 'Basic Auth: Invalid authenticate option')
      return true
    }
  )
})

test('authenticate: true, utf8: true', async t => {
  t.plan(6)

  const fastify = Fastify()
  fastify
    .register(basicAuth, { validate, authenticate: true, utf8: true })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  let res = await fastify.inject({
    url: '/',
    method: 'GET'
  })
  t.assert.ok(res.body)
  t.assert.strictEqual(res.headers['www-authenticate'], 'Basic charset="UTF-8"')
  t.assert.strictEqual(res.statusCode, 401)

  res = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  })
  t.assert.ok(res.body)
  t.assert.strictEqual(res.headers['www-authenticate'], undefined)
  t.assert.strictEqual(res.statusCode, 200)
})

test('authenticate realm: false, utf8: true', async t => {
  t.plan(6)

  const fastify = Fastify()
  fastify
    .register(basicAuth, { validate, authenticate: { realm: false }, utf8: true })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  let res = await fastify.inject({
    url: '/',
    method: 'GET'
  })
  t.assert.ok(res.body)
  t.assert.strictEqual(res.headers['www-authenticate'], 'Basic charset="UTF-8"')
  t.assert.strictEqual(res.statusCode, 401)

  res = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  })
  t.assert.ok(res.body)
  t.assert.strictEqual(res.headers['www-authenticate'], undefined)
  t.assert.strictEqual(res.statusCode, 200)
})

test('Invalid options (authenticate realm, utf8: false)', async t => {
  t.plan(6)

  const fastify = Fastify()
  await fastify
    .register(basicAuth, { validate, authenticate: { realm: true }, utf8: false })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  let res = await fastify.inject({
    url: '/',
    method: 'GET'
  })
  t.assert.ok(res.body)
  t.assert.strictEqual(res.headers['www-authenticate'], 'Basic')
  t.assert.strictEqual(res.statusCode, 401)

  res = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  })
  t.assert.ok(res.body)
  t.assert.strictEqual(res.headers['www-authenticate'], undefined)
  t.assert.strictEqual(res.statusCode, 200)
})

test('Invalid options (authenticate realm), utf8: true', async t => {
  t.plan(6)

  const fastify = Fastify()
  fastify
    .register(basicAuth, { validate, utf8: true, authenticate: { realm: true } })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  let res = await fastify.inject({
    url: '/',
    method: 'GET'
  })
  t.assert.ok(res.body)
  t.assert.strictEqual(res.headers['www-authenticate'], 'Basic charset="UTF-8"')
  t.assert.strictEqual(res.statusCode, 401)

  res = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  })
  t.assert.ok(res.body)
  t.assert.strictEqual(res.headers['www-authenticate'], undefined)
  t.assert.strictEqual(res.statusCode, 200)
})

test('Invalid options (authenticate realm = undefined, utf8: false)', async t => {
  t.plan(6)

  const fastify = Fastify()
  fastify
    .register(basicAuth, { validate, authenticate: { realm: undefined }, utf8: false })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  let res = await fastify.inject({
    url: '/',
    method: 'GET'
  })
  t.assert.ok(res.body)
  t.assert.strictEqual(res.headers['www-authenticate'], 'Basic')
  t.assert.strictEqual(res.statusCode, 401)

  res = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  })
  t.assert.ok(res.body)
  t.assert.strictEqual(res.headers['www-authenticate'], undefined)
  t.assert.strictEqual(res.statusCode, 200)
})

test('WWW-Authenticate Realm (authenticate: {realm (req) { }}, utf8: false)', async t => {
  t.plan(7)

  const fastify = Fastify()
  const authenticate = {
    realm (req) {
      t.assert.strictEqual(req.url, '/')
      return 'root'
    }
  }
  fastify.register(basicAuth, { validate, authenticate, utf8: false })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  let res = await fastify.inject({
    url: '/',
    method: 'GET'
  })
  t.assert.ok(res.body)
  t.assert.strictEqual(res.headers['www-authenticate'], 'Basic realm="root"')
  t.assert.strictEqual(res.statusCode, 401)

  res = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  })
  t.assert.ok(res.body)
  t.assert.strictEqual(res.headers['www-authenticate'], undefined)
  t.assert.strictEqual(res.statusCode, 200)
})

test('WWW-Authenticate Realm (authenticate: {realm (req) { }}), utf8', async t => {
  t.plan(7)

  const fastify = Fastify()
  const authenticate = {
    realm (req) {
      t.assert.strictEqual(req.url, '/')
      return 'root'
    }
  }
  fastify.register(basicAuth, { validate, authenticate, utf8: true })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  let res = await fastify.inject({
    url: '/',
    method: 'GET'
  })
  t.assert.ok(res.body)
  t.assert.strictEqual(res.headers['www-authenticate'], 'Basic realm="root", charset="UTF-8"')
  t.assert.strictEqual(res.statusCode, 401)

  res = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  })
  t.assert.ok(res.body)
  t.assert.strictEqual(res.headers['www-authenticate'], undefined)
  t.assert.strictEqual(res.statusCode, 200)
})

test('No 401 no realm', async t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(basicAuth, { validate, authenticate: true })

  function validate (username, password, req, res) {
    const err = new Error('Winter is coming')
    err.statusCode = 402
    return Promise.reject(err)
  }

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/',
      preHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  const { headers, statusCode, body } = await fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwdd')
    }
  })
  t.assert.ok(body)
  t.assert.strictEqual(statusCode, 402)
  t.assert.strictEqual(headers['www-authenticate'], undefined)
  t.assert.deepStrictEqual(JSON.parse(body), {
    error: 'Payment Required',
    message: 'Winter is coming',
    statusCode: 402
  })
})

function basicAuthHeader (username, password) {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
}
