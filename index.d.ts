import fastify = require('fastify');

import { Server, IncomingMessage, ServerResponse } from 'http';

declare module 'fastify' {
  interface FastifyInstance<HttpServer, HttpRequest, HttpResponse> {
    basicAuth: FastifyMiddleware<HttpServer, HttpRequest, HttpResponse>;
  }
}

declare const fastifyBasicAuth: fastify.Plugin<
  Server,
  IncomingMessage,
  ServerResponse,
  {
    validate: (
      username: string,
      password: string,
      req: fastify.FastifyRequest,
      reply: fastify.FastifyReply<ServerResponse>,
      done: (err?: Error) => void
    ) => void;
    authenticate?: boolean | { realm: string };
  }
>;

export = fastifyBasicAuth;
