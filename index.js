'use strict'

const fp = require('fastify-plugin')
const auth = require('basic-auth')
const { Unauthorized } = require('http-errors')

function basicPlugin (fastify, opts, next) {
  if (typeof opts.validate !== 'function') {
    return next(new Error('Basic Auth: Missing validate function'))
  }
  const authenticateHeader = getAuthenticateHeader(opts.authenticate)
  const validate = opts.validate.bind(fastify)
  fastify.decorate('basicAuth', basicAuth)

  next()

  function basicAuth (req, reply, next) {
    if (authenticateHeader) {
      reply.header(authenticateHeader.key, authenticateHeader.value)
    }
    var credentials = auth(req)
    if (credentials == null) {
      done(new Unauthorized('Missing or bad formatted authorization header'))
    } else {
      var result = validate(credentials.name, credentials.pass, req, reply, done)
      if (result && typeof result.then === 'function') {
        result.then(done, done)
      }
    }

    function done (err) {
      if (err !== undefined) {
        // We set the status code to be 401 if it is not set
        if (!err.statusCode) {
          err.statusCode = 401
        }
        next(err)
      } else {
        next()
      }
    }
  }
}

function getAuthenticateHeader (authenticate) {
  if (!authenticate) return false
  if (authenticate === true) {
    return {
      key: 'WWW-Authenticate',
      value: 'Basic'
    }
  }
  if (typeof authenticate === 'object') {
    const realm = (authenticate.realm && typeof authenticate.realm === 'string')
      ? authenticate.realm
      : ''
    return {
      key: 'WWW-Authenticate',
      value: 'Basic' + (realm ? ` realm="${realm}"` : '')
    }
  }

  throw Error('Basic Auth: Invalid authenticate option')
}

module.exports = fp(basicPlugin, {
  fastify: '>=1.0.0',
  name: 'fastify-basic-auth'
})
