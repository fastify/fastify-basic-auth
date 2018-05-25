# fastify-basic-auth

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)
 [![Build Status](https://travis-ci.org/fastify/fastify-basic-auth.svg?branch=master)](https://travis-ci.org/fastify/fastify-basic-auth)

 A simple basic auth plugin for Fastify.

 ## Install
```
npm i fastify-basic-auth
```
## Usage
This plugin decorates the fastifyinstance with a `basicAuth` function, which you can use inside a `preHandler` hook, in a `beforeHander` or with [`fastify-auth`](https://github.com/fastify/fastify-auth).

```js
const fastify = require('fastify')()

fastify.register(require('fastify-basic-auth'), { validate })
function validate (username, password, req, res, done) {
  if (username === 'Tyrion' && password === 'wine') {
    done()
  } else {
    done(new Error('Winter is coming'))
  }
}

fastify.after(() => {
  fastify.addHook('preHandler', fastify.basicAuth)

  fastify.get('/', (req, reply) => {
    reply.send({ hello: 'world' })
  })
})
```

Promises and *async/await* are supported as well!
```js
const fastify = require('fastify')()

fastify.register(require('fastify-basic-auth'), { validate })
async function validate (username, password, req, res) {
  if (username !== 'Tyrion' || password !== 'wine') {
    return new Error('Winter is coming')
  }
}
```

Use with `beforeHander`:
```js
const fastify = require('fastify')()

fastify.register(require('fastify-basic-auth'), { validate, disableHook: true })
async function validate (username, password, req, res) {
  if (username !== 'Tyrion' || password !== 'wine') {
    return new Error('Winter is coming')
  }
}

fastify.after(() => {
  fastify.route({
    method: 'GET',
    url: '/',
    beforeHandler: fastify.basicAuth,
    handler: async (req, reply) => {
      return { hello: 'world' }
    }
  })
})
```

Use with [`fastify-auth`](https://github.com/fastify/fastify-auth):
```js
const fastify = require('fastify')()

fastify.register(require('fastify-auth'))
fastify.register(require('fastify-basic-auth'), { validate, disableHook: true })
async function validate (username, password, req, res) {
  if (username !== 'Tyrion' || password !== 'wine') {
    return new Error('Winter is coming')
  }
}

fastify.after(() => {
  fastify.route({
    method: 'GET',
    url: '/',
    beforeHandler: fastify.auth([fastify.basicAuth]),
    handler: async (req, reply) => {
      return { hello: 'world' }
    }
  })
})
```

## License

Licensed under [MIT](./LICENSE).
