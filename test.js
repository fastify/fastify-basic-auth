'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const basicAuth = require('./index')
const fastifyAuth = require('fastify-auth')
const { Unauthorized } = require('http-errors')

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
      beforeHandler: fastify.basicAuth,
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
    t.strictEqual(res.statusCode, 200)
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
      beforeHandler: fastify.basicAuth,
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
    t.strictEqual(res.statusCode, 401)
    t.deepEqual(JSON.parse(res.payload), {
      error: 'Unauthorized',
      message: 'Winter is coming',
      statusCode: 401
    })
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
      beforeHandler: fastify.basicAuth,
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
    t.strictEqual(res.statusCode, 200)
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
      beforeHandler: fastify.basicAuth,
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
    t.strictEqual(res.statusCode, 401)
    t.deepEqual(JSON.parse(res.payload), {
      error: 'Unauthorized',
      message: 'Winter is coming',
      statusCode: 401
    })
  })
})

test('WWW-Authenticate (authenticate: true)', t => {
  t.plan(3)

  const fastify = Fastify()
  const authenticate = true
  fastify.register(basicAuth, { validate, authenticate })

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
      beforeHandler: fastify.basicAuth,
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
    t.is(res.headers['www-authenticate'], 'Basic')
    t.error(err)
    t.strictEqual(res.statusCode, 200)
  })
})

test('WWW-Authenticate Realm (authenticate: {realm: "example"})', t => {
  t.plan(3)

  const fastify = Fastify()
  const authenticate = {realm: 'example'}
  fastify.register(basicAuth, { validate, authenticate })

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
      beforeHandler: fastify.basicAuth,
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
    t.is(res.headers['www-authenticate'], 'Basic realm="example"')
    t.error(err)
    t.strictEqual(res.statusCode, 200)
  })
})

test('Missing validate function', t => {
  t.plan(1)

  const fastify = Fastify()
  fastify.register(basicAuth)

  fastify.ready(err => {
    t.is(err.message, 'Basic Auth: Missing validate function')
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
    t.strictEqual(res.statusCode, 401)
    t.deepEqual(JSON.parse(res.payload), {
      error: 'Unauthorized',
      message: 'Winter is coming',
      statusCode: 401
    })
  })
})

test('With fastify-auth - 401', t => {
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
      beforeHandler: fastify.auth([fastify.basicAuth]),
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
    t.strictEqual(res.statusCode, 401)
    t.deepEqual(JSON.parse(res.payload), {
      error: 'Unauthorized',
      message: 'Winter is coming',
      statusCode: 401
    })
  })
})

test('Hook with fastify-auth- 401', t => {
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
    t.strictEqual(res.statusCode, 401)
    t.deepEqual(JSON.parse(res.payload), {
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
      beforeHandler: fastify.basicAuth,
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
    t.strictEqual(res.statusCode, 401)
    t.deepEqual(JSON.parse(res.payload), {
      statusCode: 401,
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
      beforeHandler: fastify.basicAuth,
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
    t.strictEqual(res.statusCode, 200)
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
    t.strictEqual(err.statusCode, 401)
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
    t.strictEqual(res.statusCode, 401)
    t.deepEqual(JSON.parse(res.payload), {
      error: 'Unauthorized',
      message: 'Winter is coming',
      statusCode: 401
    })
  })
})

test('Missing header and custom error handler', t => {
  t.plan(4)

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
      beforeHandler: fastify.basicAuth,
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })
  })

  fastify.setErrorHandler(function (err, req, reply) {
    t.ok(err instanceof Unauthorized)
    reply.send(err)
  })

  fastify.inject({
    url: '/',
    method: 'GET'
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 401)
    t.deepEqual(JSON.parse(res.payload), {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Missing or bad formatted authorization header'
    })
  })
})

function basicAuthHeader (username, password) {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
}
