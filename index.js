'use strict'

const fp = require('fastify-plugin')
const createError = require('@fastify/error')

/** @typedef {import('./types/index').FastifyBasicAuthOptions} FastifyBasicAuthOptions */

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
const authScheme = 'basic'
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
const token68 = '([\\w.~+/-]+=*)'

/**
 * @see https://datatracker.ietf.org/doc/html/rfc7235#appendix-C
 */
const credentialsStrictRE = new RegExp(`^${authScheme} ${token68}$`, 'i')

const credentialsLaxRE = new RegExp(`^${BWS}*${authScheme}${BWS}+${token68}${BWS}*$`, 'i')

/**
 * @see https://datatracker.ietf.org/doc/html/rfc5234#appendix-B.1
 */
// eslint-disable-next-line no-control-regex
const controlRE = /[\x00-\x1F\x7F]/

/**
 * RegExp for basic auth user/pass
 *
 * user-pass   = userid ":" password
 * userid      = *<TEXT excluding ":">
 * password    = *TEXT
 */

const userPassRE = /^([^:]*):(.*)$/

/** @type {typeof import('./types/index').fastifyBasicAuth} */
async function fastifyBasicAuth (fastify, opts) {
  if (typeof opts.validate !== 'function') {
    throw new Error('Basic Auth: Missing validate function')
  }

  const strictCredentials = opts.strictCredentials ?? true
  const useUtf8 = opts.utf8 ?? true
  const charset = useUtf8 ? 'utf-8' : 'ascii'
  const authenticateHeader = getAuthenticateHeaders(opts.authenticate, useUtf8, opts.proxyMode)
  const header = opts.header?.toLowerCase() || (opts.proxyMode ? 'proxy-authorization' : 'authorization')
  const errorResponseCode = opts.proxyMode ? 407 : 401

  const MissingOrBadAuthorizationHeader = createError(
    'FST_BASIC_AUTH_MISSING_OR_BAD_AUTHORIZATION_HEADER',
    'Missing or bad formatted authorization header',
    errorResponseCode
  )

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
        // We set the status code to be `errorResponseCode` (normally 401) if it is not set
        if (!err.statusCode) {
          err.statusCode = errorResponseCode
        }

        if (err.statusCode === errorResponseCode) {
          const header = authenticateHeader(req)
          if (header) {
            reply.header(header[0], header[1])
          }
        }
        next(err)
      } else {
        next()
      }
    }
  }
}

/**
 * Generates a function that returns the appropriate authentication header.
 * @param {FastifyBasicAuthOptions['authenticate']} authenticate - The authenticate option.
 * @param {FastifyBasicAuthOptions['utf8']} useUtf8 - Whether to use UTF-8 charset.
 * @param {FastifyBasicAuthOptions['proxyMode']} proxyMode - Whether in proxy mode.
 * @returns {(req: import('fastify').FastifyRequest) => false | [string, string]} Function that returns header tuple or false.
 */
function getAuthenticateHeaders (authenticate, useUtf8, proxyMode) {
  const defaultHeaderName = proxyMode ? 'Proxy-Authenticate' : 'WWW-Authenticate'
  if (!authenticate) return () => false
  if (authenticate === true) {
    return useUtf8
      ? () => [defaultHeaderName, 'Basic charset="UTF-8"']
      : () => [defaultHeaderName, 'Basic']
  }
  if (typeof authenticate === 'object') {
    const realm = authenticate.realm
    const headerName = authenticate.header || defaultHeaderName
    switch (typeof realm) {
      case 'undefined':
      case 'boolean':
        return useUtf8
          ? () => [headerName, 'Basic charset="UTF-8"']
          : () => [headerName, 'Basic']
      case 'string':
        return useUtf8
          ? () => [headerName, `Basic realm="${realm}", charset="UTF-8"`]
          : () => [headerName, `Basic realm="${realm}"`]
      case 'function':
        return useUtf8
          ? (req) => [headerName, `Basic realm="${realm(req)}", charset="UTF-8"`]
          : (req) => [headerName, `Basic realm="${realm(req)}"`]
    }
  }

  throw new Error('Basic Auth: Invalid authenticate option')
}

module.exports = fp(fastifyBasicAuth, {
  fastify: '5.x',
  name: '@fastify/basic-auth'
})
module.exports.default = fastifyBasicAuth
module.exports.fastifyBasicAuth = fastifyBasicAuth
