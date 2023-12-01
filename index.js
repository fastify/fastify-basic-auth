'use strict'

const fp = require('fastify-plugin')
const createError = require('@fastify/error')

const MissingOrBadAuthorizationHeader = createError(
  'FST_BASIC_AUTH_MISSING_OR_BAD_AUTHORIZATION_HEADER',
  'Missing or bad formatted authorization header',
  401
)

/**
 * HTTP provides a simple challenge-response authentication framework
 * that can be used by a server to challenge a client request and by a
 * client to provide authentication information.  It uses a case-
 * insensitive token as a means to identify the authentication scheme,
 * followed by additional information necessary for achieving
 * authentication via that scheme.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7235#section-2.1
 *
 * The scheme name is "Basic".
 * @see https://datatracker.ietf.org/doc/html/rfc7617#section-2
 */
const authScheme = '(?:[Bb][Aa][Ss][Ii][Cc])'
/**
 * The BWS rule is used where the grammar allows optional whitespace
 * only for historical reasons.  A sender MUST NOT generate BWS in
 * messages.  A recipient MUST parse for such bad whitespace and remove
 * it before interpreting the protocol element.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7230#section-3.2.3
 */
const BWS = '[ \t]'
/**
 * The token68 syntax allows the 66 unreserved URI characters
 * ([RFC3986]), plus a few others, so that it can hold a base64,
 * base64url (URL and filename safe alphabet), base32, or base16 (hex)
 * encoding, with or without padding, but excluding whitespace
 * ([RFC4648]).
 * @see https://datatracker.ietf.org/doc/html/rfc7235#section-2.1
 */
const token68 = '([A-Za-z0-9._~+/-]+=*)'

/**
 * @see https://datatracker.ietf.org/doc/html/rfc7235#appendix-C
 */
const credentialsStrictRE = new RegExp(`^${authScheme} ${token68}$`)

const credentialsLaxRE = new RegExp(`^${BWS}*${authScheme}${BWS}+${token68}${BWS}*$`)

/**
 * @see https://datatracker.ietf.org/doc/html/rfc5234#appendix-B.1
 */
const CTL = '[\x00-\x1F\x7F]'
const controlRE = new RegExp(CTL)

/**
 * RegExp for basic auth user/pass
 *
 * user-pass   = userid ":" password
 * userid      = *<TEXT excluding ":">
 * password    = *TEXT
 */

const userPassRE = /^([^:]*):(.*)$/

async function fastifyBasicAuth (fastify, opts) {
  if (typeof opts.validate !== 'function') {
    throw new Error('Basic Auth: Missing validate function')
  }

  const strictCredentials = opts.strictCredentials ?? true
  const useUtf8 = opts.utf8 ?? true
  const charset = useUtf8 ? 'utf-8' : 'ascii'
  const authenticateHeader = getAuthenticateHeader(opts.authenticate, useUtf8)
  const header = (opts.header && opts.header.toLowerCase()) || 'authorization'

  const credentialsRE = strictCredentials
    ? credentialsStrictRE
    : credentialsLaxRE

  const validate = opts.validate.bind(fastify)
  fastify.decorate('basicAuth', basicAuth)

  function basicAuth (req, reply, next) {
    const credentials = req.headers[header]

    if (typeof credentials !== 'string') {
      done(new MissingOrBadAuthorizationHeader())
      return
    }

    // parse header
    const match = credentialsRE.exec(credentials)
    if (match === null) {
      done(new MissingOrBadAuthorizationHeader())
      return
    }

    // decode user pass
    const credentialsDecoded = Buffer.from(match[1], 'base64').toString(charset)

    /**
     * The user-id and password MUST NOT contain any control characters (see
     * "CTL" in Appendix B.1 of [RFC5234]).
     * @see https://datatracker.ietf.org/doc/html/rfc7617#section-2
     */
    if (controlRE.test(credentialsDecoded)) {
      done(new MissingOrBadAuthorizationHeader())
      return
    }

    const userPass = userPassRE.exec(credentialsDecoded)
    if (userPass === null) {
      done(new MissingOrBadAuthorizationHeader())
      return
    }

    const result = validate(userPass[1], userPass[2], req, reply, done)
    if (result && typeof result.then === 'function') {
      result.then(done, done)
    }

    function done (err) {
      if (err !== undefined) {
        // We set the status code to be 401 if it is not set
        if (!err.statusCode) {
          err.statusCode = 401
        }

        if (err.statusCode === 401) {
          const header = authenticateHeader(req)
          if (header) {
            reply.header('WWW-Authenticate', header)
          }
        }
        next(err)
      } else {
        next()
      }
    }
  }
}

function getAuthenticateHeader (authenticate, useUtf8) {
  if (!authenticate) return () => false
  if (authenticate === true) {
    return useUtf8
      ? () => 'Basic charset="UTF-8"'
      : () => 'Basic'
  }
  if (typeof authenticate === 'object') {
    const realm = authenticate.realm
    switch (typeof realm) {
      case 'undefined':
      case 'boolean':
        return useUtf8
          ? () => 'Basic charset="UTF-8"'
          : () => 'Basic'
      case 'string':
        return useUtf8
          ? () => `Basic realm="${realm}", charset="UTF-8"`
          : () => `Basic realm="${realm}"`
      case 'function':
        return useUtf8
          ? (req) => `Basic realm="${realm(req)}", charset="UTF-8"`
          : (req) => `Basic realm="${realm(req)}"`
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
