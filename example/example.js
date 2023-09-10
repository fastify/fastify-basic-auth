'use strict'

const fastify = require('fastify')()
const crypto = require('node:crypto')
const authenticate = { realm: 'Westeros' }

const validUsername = 'Tyrion'
const validPassword = 'wine'

fastify.register(require('..'), { validate, authenticate })

// perform constant-time comparison to prevent timing attacks
function compare (a, b) {
  a = Buffer.from(a)
  b = Buffer.from(b)
  if (a.length !== b.length) {
    // Delay return with cryptographically secure timing check.
    crypto.timingSafeEqual(a, a)
    return false
  }

  return crypto.timingSafeEqual(a, b)
}

// `this` inside validate is `fastify`
function validate (username, password, req, reply, done) {
  let result = true
  result = compare(username, validUsername) && result
  result = compare(password, validPassword) && result
  if (result) {
    done()
  } else {
    done(new Error('Winter is coming'))
  }
}

fastify.after(() => {
  fastify.addHook('onRequest', fastify.basicAuth)

  fastify.get('/', (req, reply) => {
    reply.send({ hello: 'world' })
  })
})

const basicAuthCredentials = Buffer.from(`${validUsername}:${validPassword}`).toString('base64')
console.log(`curl -H "authorization: Basic ${basicAuthCredentials}" http://localhost:3000`)
fastify.listen({ port: 3000 })
