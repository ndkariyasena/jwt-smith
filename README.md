<p align="center">
  <img src="./static/240x240.png" width="240" alt="JWT-Smith Logo" />
</p>
<p align="center" style="color:#79effb; font-weight:600; font-size: 3.5rem">
JWT Smith
</p>

<p align="center">
<span style="font-weight: 800; font-size: 1.1rem">JWT Smith</span> is a robust, and highly customizable library designed to simplify authentication and authorization workflows using JSON Web Tokens (JWTs).
Built on top of the powerful <span style="font-style: italic;">jsonwebtoken</span> module (version 9.0.2), JWT Smith leverages its proven reliability for token signing and verification.
We extend its capabilities with advanced features like token signing, verification, refresh token handling, role-based access control (RBAC), and security middleware—all tailored to meet modern security standards and scalable architectures.</br>
We extend our gratitude to the creators and contributors of the jsonwebtoken module for their incredible work. Their efforts have provided a solid foundation for this project and countless others in the community.
</p>

## Key Features

<ul>
<li><span style="font-weight: 600;">Comprehensive JWT Handling:</span> Easily sign, verify, and decode JWTs with customizable options for algorithms, claims, and expiration policies.</li>
<li><span style="font-weight: 600;">Refresh Token Management:</span> Seamlessly handle token renewal with pluggable strategies for secure and efficient token lifecycle management.</li>
<li><span style="font-weight: 600;">Role-Based Access Control (RBAC):</span> Use JSON file to define permissions for individual endpoints, grouped routes, or entire APIs.</li>
<li><span style="font-weight: 600;">Security Middleware:</span> Prebuilt middleware for request validation.</li>
<li><span style="font-weight: 600;">Extensible Logging:</span> Configure custom logging strategies or use the default logger for better debugging and monitoring.</li>
<li><span style="font-weight: 600;">TypeScript Ready:</span> Built with TypeScript to provide strong typing and better developer experience.</li>
<li><span style="font-weight: 600;">Supports Monorepo:</span> Ideal for applications requiring multiple interconnected modules with shared configurations.</li>
</ul>

## Installation

```bash
npm install jwt-smith
```

## Usage

```javascript
const { configure, sign, verify } = require('jwt-smith');
// OR
import { configure, sign, verify } from 'jwt-smith';

// Example usage
configure({
	signOptions: {
		algorithm: 'HS256',
	},
	publicKey: process.env.ACCESS_TOKEN_SECRET,
	refreshTokenKey: process.env.REFRESH_TOKEN_SECRET,
});

const token = sign({ userId: '12345' }, 'your-secret-key');
const decoded = verify(token, 'your-secret-key');
console.log(decoded);
```

## API

### `sign({payload, secret, options})`

Creates a new JWT token.

- `payload` (Object): The payload to encode.
- `secret` (String): The secret key to sign the token.
- `options` (Object): Optional settings.

### `verify({token, secret, options})`

Verifies a JWT token.

- `token` (String): The token to verify.
- `secret` (String): The secret key to verify the token.
- `options` (Object): Optional settings.

## Middleware

### `validateJwtCookieMiddleware`

This middleware checks for the presence of access and refresh tokens in the <span style="font-weight: 600; font-style: italic">request cookies</span>.
If neither token is found, it throws an error. If tokens are found, it validates or refreshes the tokens using the provided token generation handler and token storage.
If the tokens are valid, it appends the decoded token payload to the request object and sets new tokens in the cookies if necessary. If the tokens are invalid or an error occurs during validation, it responds with a 401 Unauthorized status and an error message.

```javascript
import express from 'express';
import cookieParser from 'cookie-parser';
import { AuthTokenStorage, authTokenGeneration } from 'Your_Custom_Token_Handling_Method';
import { configure, validateJwtHeaderMiddleware } from 'jwt-smith';

const app = express();

// Middleware for parsing JSON payloads
app.use(express.json());
app.use(cookieParser());

configure({
	tokenStorage: new AuthTokenStorage(),
	middlewareConfigs: {
		tokenGenerationHandler: authTokenGeneration,
		appendToRequest: ['user', 'role'],
		cookieSettings: {
			accessTokenCookieName: 'app-auth-token',
			refreshTokenCookieName: 'app-auth-refresh-token',
			refreshCookieOptions: {
				httpOnly: true,
				sameSite: false,
			},
		},
	},
});

// Apply the validateJwtCookieMiddleware globally or to specific routes
app.use(validateJwtCookieMiddleware);

// Define a protected route
app.get('/protected', (req, res) => {
	res.status(200).json({ message: 'Access granted! Your token is valid.' });
});

// Define a fallback route for unmatched paths
app.use((req, res) => {
	res.status(404).json({ error: 'Not found' });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
```

### How It Works

<ol>
  <li>Token Presence Check:</li>
    <ul>
      <li>The middleware checks the "access_token" and "refresh_token" in the request cookies.</li>
      <li>If neither token is found, it throws an error.</li>
    </ul>

  <li>Validation & Refresh:</li>
    <ul>
      <li>If the access token is invalid but a valid refresh token exists, a new access token is generated.</li>
    </ul>

  <li>Request Augmentation:</li>
    <ul>
      <li>On successful validation, the decoded payload is attached to the req object (e.g., req.user).</li>
    </ul>

  <li>Cookie Update:</li>
    <ul>
      <li>If tokens are refreshed, the middleware updates the cookies with the new tokens.</li>
    </ul>

  <li>Error Handling:</li>
    <ul>
      <li>If validation fails or an error occurs, it responds with a 401 Unauthorized status and an error message.</li>
    </ul>
</ol>

### `validateJwtHeaderMiddleware`

This middleware checks for the presence of a JWT token in the <span style="font-weight: 600; font-style: italic">Authorization header</span>.
If the token is not found, it throws an error. If the token is found, it validates the token using the provided secret key.
If the token is valid, it appends the decoded token payload to the request object. If the token is invalid or an error occurs during validation, it responds with a 401 Unauthorized status and an error message.

```javascript
import express from 'express';
import { configure, validateJwtHeaderMiddleware } from 'jwt-smith';

const app = express();

// Middleware for parsing JSON payloads
app.use(express.json());

configure({
	signOptions: {
		algorithm: 'HS256',
	},
	publicKey: process.env.ACCESS_TOKEN_SECRET,
});

// Apply the validateJwtHeaderMiddleware globally or to specific routes
app.use(validateJwtHeaderMiddleware);

// Define a protected route
app.get('/protected', (req, res) => {
	res.status(200).json({ message: 'Access granted! Your token is valid.' });
});

// Define a fallback route for unmatched paths
app.use((req, res) => {
	res.status(404).json({ error: 'Not found' });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
```

### How It Works

<ol>
  <li>Token Presence Check:</li>
  <ul>
    <li>The middleware checks the "Authorization" header for a JWT token.</li>
    <li>If the token is not found, it throws an error.</li>
  </ul>

  <li>Validation:</li>
  <ul>
    <li>If the token is found, it validates the token using the provided secret key.</li>
  </ul>

  <li>Request Augmentation:</li>
  <ul>
    <li>On successful validation, the decoded payload is attached to the req object (e.g., req.user).</li>
  </ul>

  <li>Error Handling:</li>
  <ul>
    <li>If validation fails or an error occurs, it responds with a 401 Unauthorized status and an error message.</li>
  </ul>
</ol>

### `roleBasedAuthenticationMiddleware`

Middleware to authorize users based on roles.

```javascript
const { roleBasedAuthenticationMiddleware } = require('jwt-smith/src/middleware');

app.use(roleBasedAuthenticationMiddleware(['admin', 'user']));
```

- `roles` (Array): The roles allowed to access the route.

## License

This project is licensed under the MIT License.
