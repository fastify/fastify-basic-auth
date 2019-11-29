import * as Fastify from 'fastify';
import * as fastifyBasicAuth from '../..';

const app = Fastify();

const authenticate = { realm: 'Westeros' };
app.register(fastifyBasicAuth, {
  validate: function validate(username, password, req, reply, done) {
    if (username === 'Tyrion' && password === 'wine') {
      done();
    } else {
      done(new Error('Winter is coming'));
    }
  },
  authenticate
});

app.after(() => {
  app.addHook('preHandler', app.basicAuth);

  app.get('/', (req, reply) => {
    reply.send({ hello: 'world' });
  });

  app.route({
    method: 'GET',
    url: '/',
    preHandler: app.basicAuth,
    handler: async (req, reply) => {
      return { hello: 'world' };
    }
  });
});
