# jwt-smith

Enhanced JWT Authentication and Authorization Module

## Installation

```bash
npm install jwt-smith
```

## Usage

```javascript
const jwtSmith = require('jwt-smith');

// Example usage
const token = jwtSmith.sign({ userId: '12345' }, 'your-secret-key');
const decoded = jwtSmith.verify(token, 'your-secret-key');
console.log(decoded);
```

## Features

- Sign and verify JWT tokens
- Support for custom payloads
- Token expiration handling
- Easy integration with Node.js applications

## API

### `sign(payload, secret, options)`

Creates a new JWT token.

- `payload` (Object): The payload to encode.
- `secret` (String): The secret key to sign the token.
- `options` (Object): Optional settings.

### `verify(token, secret, options)`

Verifies a JWT token.

- `token` (String): The token to verify.
- `secret` (String): The secret key to verify the token.
- `options` (Object): Optional settings.

## Middleware

### `authenticate(req, res, next)`

Middleware to authenticate JWT tokens in requests.

```javascript
const { authenticate } = require('jwt-smith/src/middleware');

app.use(authenticate('your-secret-key'));
```

- `secret` (String): The secret key to verify the token.

### `authorize(roles)`

Middleware to authorize users based on roles.

```javascript
const { authorize } = require('jwt-smith/src/middleware');

app.use(authorize(['admin', 'user']));
```

- `roles` (Array): The roles allowed to access the route.

## License

This project is licensed under the MIT License.
