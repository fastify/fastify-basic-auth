import { expectType, expectAssignable } from 'tsd'
import fastify, {
  FastifyRequest,
  FastifyReply,
  onRequestHookHandler,
  preParsingHookHandler,
  preValidationHookHandler,
  preHandlerHookHandler,
  FastifyInstance
} from 'fastify'
import fastifyBasicAuth from '.'

const app = fastify()

//validation ok
app.register(fastifyBasicAuth, {
  validate: async function validatePromise (username, password, req, reply) {
    expectType<string>(username)
    expectType<string>(password)
    expectType<FastifyRequest>(req)
    expectType<FastifyReply>(reply)
    expectType<FastifyInstance>(this)
  },
  header: 'x-forwarded-authorization'
})

//validation failure
app.register(fastifyBasicAuth, {
  validate: async function validatePromise (username, password, req, reply) {
    expectType<string>(username)
    expectType<string>(password)
    expectType<FastifyRequest>(req)
    expectType<FastifyReply>(reply)
    expectType<FastifyInstance>(this)
    return new Error("unauthorized")
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
    expectType<FastifyInstance>(this)
  }
})

expectAssignable<onRequestHookHandler>(app.basicAuth)
expectAssignable<preValidationHookHandler>(app.basicAuth)
expectAssignable<preHandlerHookHandler>(app.basicAuth)
