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

type FastifyBasicAuth = FastifyPluginAsync<fastifyBasicAuth.FastifyBasicAuthOptions>

declare namespace fastifyBasicAuth {
  export interface FastifyBasicAuthOptions {
    validate(
      this: FastifyInstance,
      username: string,
      password: string,
      req: FastifyRequest,
      reply: FastifyReply,
      done: (err?: Error) => void
    ): void | Promise<void | Error>;
    authenticate?: boolean | { realm: string | ((req: FastifyRequest) => string) };
    header?: string;
    strictCredentials?: boolean;
    utf8?: boolean;
  }

  export const fastifyBasicAuth: FastifyBasicAuth
  export { fastifyBasicAuth as default }
}

declare function fastifyBasicAuth(...params: Parameters<FastifyBasicAuth>): ReturnType<FastifyBasicAuth>
export = fastifyBasicAuth
