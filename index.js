'use strict'

const fp = require('fastify-plugin')
const auth = require('basic-auth')
const createError = require('@fastify/error')

const MissingOrBadAuthorizationHeader = createError(
  'FST_BASIC_AUTH_MISSING_OR_BAD_AUTHORIZATION_HEADER',
  'Missing or bad formatted authorization header',
  401
)

async function fastifyBasicAuth (fastify, opts) {
  if (typeof opts.validate !== 'function') {
    throw new Error('Basic Auth: Missing validate function')
  }
  const authenticateHeader = getAuthenticateHeader(opts.authenticate)
  const header = (opts.header && opts.header.toLowerCase()) || 'authorization'

  const validate = opts.validate.bind(fastify)
  fastify.decorate('basicAuth', basicAuth)

  function basicAuth (req, reply, next) {
    const credentials = auth.parse(req.headers[header])
    if (credentials == null) {
      done(new MissingOrBadAuthorizationHeader())
    } else {
      const result = validate(credentials.name, credentials.pass, req, reply, done)
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

        if (err.statusCode === 401) {
          switch (typeof authenticateHeader) {
            case 'string':
              reply.header('WWW-Authenticate', authenticateHeader)
              break
            case 'function':
              reply.header('WWW-Authenticate', authenticateHeader(req))
              break
          }
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
    return 'Basic'
  }
  if (typeof authenticate === 'object') {
    const realm = authenticate.realm
    switch (typeof realm) {
      case 'undefined':
        return 'Basic'
      case 'boolean':
        return 'Basic'
      case 'string':
        return `Basic realm="${realm}"`
      case 'function':
        return function (req) {
          return `Basic realm="${realm(req)}"`
        }
    }
  }

  throw new Error('Basic Auth: Invalid authenticate option')
}

module.exports = fp(fastifyBasicAuth, {
  fastify: '4.x',
  name: '@fastify/basic-auth'
})
module.exports.default = fastifyBasicAuth
module.exports.fastifyBasicAuth = fastifyBasicAuth
