# @fastify/basic-auth

[![CI](https://github.com/fastify/fastify-basic-auth/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/fastify/fastify-basic-auth/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/@fastify/basic-auth.svg?style=flat)](https://www.npmjs.com/package/@fastify/basic-auth)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-brightgreen?style=flat)](https://github.com/neostandard/neostandard)

 A simple [Basic auth](https://datatracker.ietf.org/doc/html/rfc7617) plugin for Fastify.

 ## Install
```
npm i @fastify/basic-auth
```

### Compatibility
| Plugin version | Fastify version |
| ---------------|-----------------|
| `^6.x`         | `^5.x`          |
| `^4.x`         | `^4.x`          |
| `^1.x`         | `^3.x`          |
| `^0.x`         | `^2.x`          |
| `^0.x`         | `^1.x`          |


Please note that if a Fastify version is out of support, then so are the corresponding versions of this plugin
in the table above.
See [Fastify's LTS policy](https://github.com/fastify/fastify/blob/main/docs/Reference/LTS.md) for more details.

## Usage
This plugin decorates the fastify instance with a `basicAuth` function, which you can use inside any hook before your route handler, or with [`@fastify/auth`](https://github.com/fastify/fastify-auth).

```js
const fastify = require('fastify')()
const authenticate = {realm: 'Westeros'}
fastify.register(require('@fastify/basic-auth'), { validate, authenticate })
// `this` inside validate is `fastify`
function validate (username, password, req, reply, done) {
  if (username === 'Tyrion' && password === 'wine') {
    done()
  } else {
    done(new Error('Winter is coming'))
  }
}

fastify.after(() => {
  fastify.addHook('onRequest', fastify.basicAuth)

  fastify.get('/', (req, reply) => {
    reply.send({ hello: 'world' })
  })
})
```

Promises and *async/await* are supported as well!
```js
const fastify = require('fastify')()
const authenticate = {realm: 'Westeros'}
fastify.register(require('@fastify/basic-auth'), { validate, authenticate })
async function validate (username, password, req, reply) {
  if (username !== 'Tyrion' || password !== 'wine') {
    return new Error('Winter is coming')
  }
}
```

Use with `onRequest`:
```js
const fastify = require('fastify')()
const authenticate = {realm: 'Westeros'}
fastify.register(require('@fastify/basic-auth'), { validate, authenticate })
async function validate (username, password, req, reply) {
  if (username !== 'Tyrion' || password !== 'wine') {
    return new Error('Winter is coming')
  }
}

fastify.after(() => {
  fastify.route({
    method: 'GET',
    url: '/',
    onRequest: fastify.basicAuth,
    handler: async (req, reply) => {
      return { hello: 'world' }
    }
  })
})
```

Use with [`@fastify/auth`](https://github.com/fastify/fastify-auth):
```js
const fastify = require('fastify')()
const authenticate = {realm: 'Westeros'}
fastify.register(require('@fastify/auth'))
fastify.register(require('@fastify/basic-auth'), { validate, authenticate })
async function validate (username, password, req, reply) {
  if (username !== 'Tyrion' || password !== 'wine') {
    return new Error('Winter is coming')
  }
}

fastify.after(() => {
  // use preHandler to authenticate all the routes
  fastify.addHook('preHandler', fastify.auth([fastify.basicAuth]))

  fastify.route({
    method: 'GET',
    url: '/',
    // use onRequest to authenticate just this one
    onRequest: fastify.auth([fastify.basicAuth]),
    handler: async (req, reply) => {
      return { hello: 'world' }
    }
  })
})
```

### Custom error handler

On failed authentication, *@fastify/basic-auth* will call the Fastify
[generic error
handler](https://fastify.dev/docs/latest/Reference/Server/#seterrorhandler) with an error.
*@fastify/basic-auth* sets the `err.statusCode` property to `401`.

To properly `401` errors:

```js
fastify.setErrorHandler(function (err, req, reply) {
  if (err.statusCode === 401) {
    // This was unauthorized! Display the correct page/message
    reply.code(401).send({ was: 'unauthorized' })
    return
  }
  reply.send(err)
})
```

## Options

### `utf8` <Boolean> (optional, default: true)

User-ids or passwords containing characters outside the US-ASCII
character set will cause interoperability issues unless both
communication partners agree on what character encoding scheme is to
be used. If utf8 is set to true the server will send the 'charset' parameter
to indicate a preference of "UTF-8", increasing the probability that
clients will switch to that encoding.

### `strictCredentials` <Boolean> (optional, default: true)

If strictCredentials is set to false the authorization header can contain
additional whitespaces at the beginning, middle, and end of the
authorization header.
This is a fallback option to ensure the same behavior as `@fastify/basic-auth`
version <=5.x.

### `validate` <Function> (required)

The `validate` function is called on each request made
and is passed the `username`, `password`, `req`, and `reply`
parameters, in that order. An optional fifth parameter, `done`, may be
used to signify a valid request when called with no arguments
or an invalid request when called with an `Error` object. Alternatively,
the `validate` function may return a promise, resolving for valid
requests and rejecting for invalid. This can also be achieved using
an `async/await` function, and throwing for invalid requests.

See code above for examples.

### `authenticate` <Boolean|Object> (optional, default: false)

When supplied, the `authenticate` option will cause the
[`WWW-Authenticate` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate) to be added. It may also be used to set the `realm` value.

This can be useful in situations where we want to trigger client-side authentication interfaces - for instance the browser authentication dialog.

As a boolean setting `authenticate` to `true` will set a header like so: `WWW-Authenticate: Basic`. When `false`, no header is added. This is the default.

```js
fastify.register(require('@fastify/basic-auth'), {
  validate,
  authenticate: true // WWW-Authenticate: Basic
})

fastify.register(require('@fastify/basic-auth'), {
  validate,
  authenticate: false // no authenticate header, same as omitting authenticate option
})
```

When supplied as an object the `authenticate` option may have a `realm` key.

If the `realm` key is supplied, it will be appended to the header value:

```js
fastify.register(require('@fastify/basic-auth'), {
  validate,
  authenticate: {realm: 'example'} // WWW-Authenticate: Basic realm="example"
})
```

The `realm` key could also be a function:

```js
fastify.register(require('@fastify/basic-auth'), {
  validate,
  authenticate: {
    realm(req) {
      return 'example' // WWW-Authenticate: Basic realm="example"
    }
  }
})
```

### `header` String (optional)

When supplied, the header option is the name of the header to get
credentials from for validation.

```js
fastify.register(require('@fastify/basic-auth'), {
  validate,
  header: 'x-forwarded-authorization'
})
```

## License

Licensed under [MIT](./LICENSE).
