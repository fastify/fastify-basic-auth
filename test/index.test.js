'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const basicAuth = require('..')
const fastifyAuth = require('@fastify/auth')

test('Basic', t => {
  t.plan(2)

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

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
  })
})

test('Basic utf8: true', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      /**
       * @see https://datatracker.ietf.org/doc/html/rfc7617#section-2.1
       */
      authorization: 'Basic dGVzdDoxMjPCow=='
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
  })
})

test('Basic - 401, sending utf8 credentials base64 but utf8: false', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      /**
      * @see https://datatracker.ietf.org/doc/html/rfc7617#section-2.1
      */
      authorization: 'Basic dGVzdDoxMjPCow=='
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 401)
    t.same(JSON.parse(res.payload), {
      error: 'Unauthorized',
      message: 'Unauthorized',
      statusCode: 401
    })
  })
})

test('Basic - 401', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwdd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 401)
    t.same(JSON.parse(res.payload), {
      error: 'Unauthorized',
      message: 'Winter is coming',
      statusCode: 401
    })
  })
})

test('Basic - Invalid Header value /1', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: 'Bearer ' + Buffer.from('user:pass').toString('base64')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 401)
    t.same(JSON.parse(res.payload), {
      code: 'FST_BASIC_AUTH_MISSING_OR_BAD_AUTHORIZATION_HEADER',
      error: 'Unauthorized',
      message: 'Missing or bad formatted authorization header',
      statusCode: 401
    })
  })
})

test('Basic - Invalid Header value /2', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: 'Basic ' + Buffer.from('user').toString('base64')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 401)
    t.same(JSON.parse(res.payload), {
      code: 'FST_BASIC_AUTH_MISSING_OR_BAD_AUTHORIZATION_HEADER',
      error: 'Unauthorized',
      message: 'Missing or bad formatted authorization header',
      statusCode: 401
    })
  })
})

test('Basic - Invalid Header value /3', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: 'Basic ' + Buffer.from('user\x00:pwd').toString('base64')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 401)
    t.same(JSON.parse(res.payload), {
      code: 'FST_BASIC_AUTH_MISSING_OR_BAD_AUTHORIZATION_HEADER',
      error: 'Unauthorized',
      message: 'Missing or bad formatted authorization header',
      statusCode: 401
    })
  })
})

test('Basic - strictCredentials: false', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: '      Basic ' + Buffer.from('user:pwd').toString('base64')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
  })
})

test('Basic with promises', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
  })
})

test('Basic with promises - 401', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwdd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 401)
    t.same(JSON.parse(res.payload), {
      error: 'Unauthorized',
      message: 'Winter is coming',
      statusCode: 401
    })
  })
})

test('WWW-Authenticate (authenticate: true)', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], 'Basic')
    t.equal(res.statusCode, 401)
  })

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], undefined)
    t.equal(res.statusCode, 200)
  })
})

test('WWW-Authenticate (authenticate: false)', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], undefined)
    t.equal(res.statusCode, 401)
  })

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], undefined)
    t.equal(res.statusCode, 200)
  })
})

test('WWW-Authenticate Realm (authenticate: {realm: "example"}, utf8: false)', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], 'Basic realm="example"')
    t.equal(res.statusCode, 401)
  })

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], undefined)
    t.equal(res.statusCode, 200)
  })
})

test('WWW-Authenticate Realm (authenticate: {realm: "example"}, utf8: true)', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], 'Basic realm="example", charset="UTF-8"')
    t.equal(res.statusCode, 401)
  })

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], undefined)
    t.equal(res.statusCode, 200)
  })
})

test('Header option specified', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('notuser', 'notpwd'),
      'x-forwarded-authorization': basicAuthHeader('user', 'pwd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
  })
})

test('Missing validate function', t => {
  t.plan(1)

  const fastify = Fastify()
  fastify.register(basicAuth)

  fastify.ready(err => {
    t.equal(err.message, 'Basic Auth: Missing validate function')
  })
})

test('Hook - 401', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwdd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 401)
    t.same(JSON.parse(res.payload), {
      error: 'Unauthorized',
      message: 'Winter is coming',
      statusCode: 401
    })
  })
})

test('With @fastify/auth - 401', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwdd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 401)
    t.same(JSON.parse(res.payload), {
      error: 'Unauthorized',
      message: 'Winter is coming',
      statusCode: 401
    })
  })
})

test('Hook with @fastify/auth- 401', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwdd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 401)
    t.same(JSON.parse(res.payload), {
      error: 'Unauthorized',
      message: 'Winter is coming',
      statusCode: 401
    })
  })
})

test('Missing header', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 401)
    t.same(JSON.parse(res.payload), {
      statusCode: 401,
      code: 'FST_BASIC_AUTH_MISSING_OR_BAD_AUTHORIZATION_HEADER',
      error: 'Unauthorized',
      message: 'Missing or bad formatted authorization header'
    })
  })
})

test('Fastify context', t => {
  t.plan(3)

  const fastify = Fastify()
  fastify.decorate('test', true)
  fastify.register(basicAuth, { validate })

  function validate (username, password, req, res, done) {
    t.ok(this.test)
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

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
  })
})

test('setErrorHandler custom error and 401', t => {
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
    t.equal(err.statusCode, 401)
    reply.send(err)
  })

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwdd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 401)
    t.same(JSON.parse(res.payload), {
      error: 'Unauthorized',
      message: 'Winter is coming',
      statusCode: 401
    })
  })
})

test('Missing header and custom error handler', t => {
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
    t.ok(err instanceof Error)
    t.ok(err.statusCode === 401)
    t.ok(err.code === 'FST_BASIC_AUTH_MISSING_OR_BAD_AUTHORIZATION_HEADER')
    reply.send(err)
  })

  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 401)
    t.same(JSON.parse(res.payload), {
      statusCode: 401,
      code: 'FST_BASIC_AUTH_MISSING_OR_BAD_AUTHORIZATION_HEADER',
      error: 'Unauthorized',
      message: 'Missing or bad formatted authorization header'
    })
  })
})

test('Invalid options (authenticate)', t => {
  t.plan(1)

  const fastify = Fastify()
  fastify
    .register(basicAuth, { validate, authenticate: 'i am invalid' })

  function validate (username, password, req, res, done) {
    if (username === 'user' && password === 'pwd') {
      done()
    } else {
      done(new Error('Unauthorized'))
    }
  }

  fastify.ready(function (err) {
    t.equal(err.message, 'Basic Auth: Invalid authenticate option')
  })
})

test('authenticate: true, utf8: true', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], 'Basic charset="UTF-8"')
    t.equal(res.statusCode, 401)
  })

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], undefined)
    t.equal(res.statusCode, 200)
  })
})

test('authenticate realm: false, utf8: true', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], 'Basic charset="UTF-8"')
    t.equal(res.statusCode, 401)
  })

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], undefined)
    t.equal(res.statusCode, 200)
  })
})

test('Invalid options (authenticate realm, utf8: false)', t => {
  t.plan(6)

  const fastify = Fastify()
  fastify
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

  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], 'Basic')
    t.equal(res.statusCode, 401)
  })

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], undefined)
    t.equal(res.statusCode, 200)
  })
})

test('Invalid options (authenticate realm), utf8: true', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], 'Basic charset="UTF-8"')
    t.equal(res.statusCode, 401)
  })

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], undefined)
    t.equal(res.statusCode, 200)
  })
})

test('Invalid options (authenticate realm = undefined, utf8: false)', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], 'Basic')
    t.equal(res.statusCode, 401)
  })

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], undefined)
    t.equal(res.statusCode, 200)
  })
})

test('WWW-Authenticate Realm (authenticate: {realm (req) { }}, utf8: false)', t => {
  t.plan(7)

  const fastify = Fastify()
  const authenticate = {
    realm (req) {
      t.equal(req.url, '/')
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

  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], 'Basic realm="root"')
    t.equal(res.statusCode, 401)
  })

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], undefined)
    t.equal(res.statusCode, 200)
  })
})

test('WWW-Authenticate Realm (authenticate: {realm (req) { }}), utf8', t => {
  t.plan(7)

  const fastify = Fastify()
  const authenticate = {
    realm (req) {
      t.equal(req.url, '/')
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

  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], 'Basic realm="root", charset="UTF-8"')
    t.equal(res.statusCode, 401)
  })

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.headers['www-authenticate'], undefined)
    t.equal(res.statusCode, 200)
  })
})

test('No 401 no realm', t => {
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

  fastify.inject({
    url: '/',
    method: 'GET',
    headers: {
      authorization: basicAuthHeader('user', 'pwdd')
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 402)
    t.equal(res.headers['www-authenticate'], undefined)
    t.same(JSON.parse(res.payload), {
      error: 'Payment Required',
      message: 'Winter is coming',
      statusCode: 402
    })
  })
})

function basicAuthHeader (username, password) {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
}
