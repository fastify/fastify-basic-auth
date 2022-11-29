'use strict'

const fastify = require('fastify')()
const authenticate = {realm: 'Westeros'}

const validUsername = 'Tyrion'
const validPassword = 'wine'

fastify.register(require('..'), { validate, authenticate })
// `this` inside validate is `fastify`
function validate (username, password, req, reply, done) {
  if (username === validUsername && password === validPassword) {
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