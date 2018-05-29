'use strict'

const fp = require('fastify-plugin')
const auth = require('basic-auth')

function basicPlugin (fastify, opts, next) {
  if (typeof opts.validate !== 'function') {
    return next(new Error('Basic Auth: Missing validate function'))
  }

  const validate = opts.validate
  fastify.decorate('basicAuth', basicAuth)

  next()

  function basicAuth (req, reply, next) {
    var credentials = auth(req)
    if (credentials == null) {
      done(new Error('Access denied'))
    } else {
      var result = validate(credentials.name, credentials.pass, req, reply, done)
      if (result && typeof result.then === 'function') {
        result.then(done, done)
      }
    }

    function done (err) {
      if (err !== undefined) {
        reply.code(401)
        next(err)
      } else {
        next()
      }
    }
  }
}

module.exports = fp(basicPlugin, {
  fastify: '>=1.0.0',
  name: 'fastify-basic-auth'
})
