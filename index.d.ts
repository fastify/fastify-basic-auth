import {
  FastifyRequest,
  FastifyPlugin,
  FastifyReply,
  onRequestHookHandler,
  preParsingHookHandler,
  preValidationHookHandler,
  preHandlerHookHandler
} from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    basicAuth: onRequestHookHandler |
      preValidationHookHandler |
      preHandlerHookHandler
  }
}

export interface FastifyBasicAuthOptions {
  validate(
    username: string,
    password: string,
    req: FastifyRequest,
    reply: FastifyReply,
    done: (err?: Error) => void
  ): void | Promise<void>;
  authenticate?: boolean | { realm: string };
}

declare const fastifyBasicAuth: FastifyPlugin<FastifyBasicAuthOptions>
export default fastifyBasicAuth;
