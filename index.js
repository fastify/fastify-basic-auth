'use strict'

const fp = require('fastify-plugin')
const auth = require('basic-auth')
const { Unauthorized } = require('http-errors')

async function basicPlugin (fastify, opts) {
  if (typeof opts.validate !== 'function') {
    throw new Error('Basic Auth: Missing validate function')
  }
  const authenticateHeader = getAuthenticateHeader(opts.authenticate)
  const validate = opts.validate.bind(fastify)
  fastify.decorate('basicAuth', basicAuth)

  function basicAuth (req, reply, next) {
    const credentials = auth(req)
    if (credentials == null) {
      done(new Unauthorized('Missing or bad formatted authorization header'))
    } else {
      const result = validate(credentials.name, credentials.pass, req, reply, done)
      if (result && typeof result.then === 'function') {
        result.then(done, done)
      }
    }

    function done (err, realm) {
      // TODO remove in the next major
      if (typeof err === 'string') {
        realm = err
        err = undefined
      }
      if (err) {
        // We set the status code to be 401 if it is not set
        if (!err.statusCode) {
          err.statusCode = 401
        }
        next(err)
      } else {
        const header = realm ? formatRealm(realm) : authenticateHeader
        reply.header('WWW-Authenticate', header)
        next()
      }
    }
  }
}

function getAuthenticateHeader (authenticate) {
  if (!authenticate) return false
  if (authenticate === true) {
    return 'Basic'
  }
  if (typeof authenticate === 'object') {
    const realm = formatRealm(authenticate.realm)
    if (realm) {
      return realm
    }
  }

  throw new Error('Basic Auth: Invalid authenticate option')
}

function formatRealm (realm) {
  switch (typeof realm) {
    case 'undefined':
      return 'Basic'
    case 'boolean':
      return 'Basic'
    case 'string':
      return `Basic realm="${realm}"`
  }
}

module.exports = fp(basicPlugin, {
  fastify: '3.x',
  name: 'fastify-basic-auth'
})
