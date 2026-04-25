import { expect } from 'tstyche'
import fastify, {
  FastifyRequest,
  FastifyReply,
  onRequestHookHandler,
  preValidationHookHandler,
  preHandlerHookHandler,
  FastifyInstance
} from 'fastify'
import fastifyBasicAuth from '..'

const app = fastify()

// validation ok
app.register(fastifyBasicAuth, {
  validate: async function validatePromise (username, password, req, reply) {
    expect(username).type.toBe<string>()
    expect(password).type.toBe<string>()
    expect(req).type.toBe<FastifyRequest>()
    expect(reply).type.toBe<FastifyReply>()
    expect(this).type.toBe<FastifyInstance>()
  },
  header: 'x-forwarded-authorization'
})

// validation failure
app.register(fastifyBasicAuth, {
  validate: async function validatePromise (username, password, req, reply) {
    expect(username).type.toBe<string>()
    expect(password).type.toBe<string>()
    expect(req).type.toBe<FastifyRequest>()
    expect(reply).type.toBe<FastifyReply>()
    expect(this).type.toBe<FastifyInstance>()
    return new Error('unauthorized')
  },
  header: 'x-forwarded-authorization'
})

app.register(fastifyBasicAuth, {
  validate: function validateCallback (username, password, req, reply, done) {
    expect(username).type.toBe<string>()
    expect(password).type.toBe<string>()
    expect(req).type.toBe<FastifyRequest>()
    expect(reply).type.toBe<FastifyReply>()
    expect(done).type.toBeAssignableTo<(err?: Error) => void>()
    expect(this).type.toBe<FastifyInstance>()
  }
})

// authenticate boolean
app.register(fastifyBasicAuth, {
  validate: () => {},
  authenticate: true
})

// authenticate with realm
app.register(fastifyBasicAuth, {
  validate: () => {},
  authenticate: { realm: 'example' }
})

// authenticate with realm (function)
app.register(fastifyBasicAuth, {
  validate: () => {},
  authenticate: {
    realm: function realm (req) {
      return req.url
    }
  }
})

// authenticate with custom header
app.register(fastifyBasicAuth, {
  validate: () => {},
  authenticate: { header: 'x-custom-authenticate' }
})

// authenticate in proxy mode
app.register(fastifyBasicAuth, {
  validate: () => {},
  proxyMode: true,
  authenticate: true,
})

app.register(fastifyBasicAuth, {
  validate: () => {},
  strictCredentials: true
})

app.register(fastifyBasicAuth, {
  validate: () => {},
  utf8: true
})

app.register(fastifyBasicAuth, {
  validate: () => {},
  strictCredentials: undefined,
  utf8: undefined
})

expect(app.basicAuth).type.toBeAssignableTo<onRequestHookHandler>()
expect(app.basicAuth).type.toBeAssignableTo<preValidationHookHandler>()
expect(app.basicAuth).type.toBeAssignableTo<preHandlerHookHandler>()
