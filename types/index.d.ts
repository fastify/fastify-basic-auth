import {
  FastifyRequest,
  FastifyPluginAsync,
  FastifyReply,
  onRequestHookHandler,
  preValidationHookHandler,
  preHandlerHookHandler,
  FastifyInstance
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
    this: FastifyInstance,
    username: string,
    password: string,
    req: FastifyRequest,
    reply: FastifyReply,
    done: (err?: Error) => void
  ): void | Promise<void|Error>;
  authenticate?: boolean | { realm: string | ((req: FastifyRequest) => string) };
  header?: string;
}

declare const fastifyBasicAuth: FastifyPluginAsync<FastifyBasicAuthOptions>
export default fastifyBasicAuth;
