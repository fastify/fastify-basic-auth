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
  validate: (
    (
      username: string,
      password: string,
      req: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<Error | void>
  ) | (
    (
      username: string,
      password: string,
      req: FastifyRequest,
      reply: FastifyReply,
      done: (err?: Error) => void
    ) => void
  );
  authenticate?: boolean | { realm: string };
  header?: string;
}

declare const fastifyBasicAuth: FastifyPlugin<FastifyBasicAuthOptions>
export default fastifyBasicAuth;
