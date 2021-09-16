import { expectType, expectAssignable } from 'tsd'
import fastify, {
  FastifyRequest,
  FastifyReply,
  onRequestHookHandler,
  preParsingHookHandler,
  preValidationHookHandler,
  preHandlerHookHandler
}  from 'fastify'
import fastifyBasicAuth from '.'

const app = fastify()

app.register(fastifyBasicAuth, {
  validate: async function validatePromise (username, password, req, reply) {
    expectType<string>(username)
    expectType<string>(password)
    expectType<FastifyRequest>(req)
    expectType<FastifyReply>(reply)
    if (Math.random() > 0.5) return new Error()
  },
  header: 'x-forwarded-authorization'
})

app.register(fastifyBasicAuth, {
  validate: function validateCallback (username, password, req, reply, done) {
    expectType<string>(username)
    expectType<string>(password)
    expectType<FastifyRequest>(req)
    expectType<FastifyReply>(reply)
    expectAssignable<(err?: Error) => void>(done)
  }
})

expectAssignable<onRequestHookHandler>(app.basicAuth)
expectAssignable<preValidationHookHandler>(app.basicAuth)
expectAssignable<preHandlerHookHandler>(app.basicAuth)
