# JWT Smith 🛡️

**A powerful, customizable, and secure JWT authentication module for Node.js.**

[![npm version](https://img.shields.io/npm/v/jwt-smith)](https://www.npmjs.com/package/jwt-smith)  
[![License](https://img.shields.io/github/license/ndkariyasena/jwt-smith)](LICENSE)  
[![Build Status](https://github.com/ndkariyasena/jwt-smith/actions/workflows/npm-publisher.yml/badge.svg)](https://github.com/ndkariyasena/jwt-smith/actions)

---

## 🚀 Features

✅ **Easy to Use** – Simple API for signing, verifying, and handling JWT tokens.  
🔐 **Middleware Protection** – Prebuilt Express middlewares for authentication and role-based access.  
⚙️ **Customizable** – Flexible token handling with blacklisting, rotation, and configuration options.  
📌 **Secure** – Supports token revocation, expiration, and advanced security best practices.  
📚 **Well-Documented** – Comprehensive documentation for smooth integration.

---

## 📚 Installation

```sh
npm install jwt-smith
```

---

## 🛠️ Usage

#### 🌐 For a comprehensive guide and detailed information, please visit the official documentation website. [**JWT Smith Documentation**](https://jwt-smith.ndkariyasena.com)

### 1️⃣ **Initialize JWT Manager**

```typescript
import { JwtManager } from 'jwt-smith';

const jwtManager = new JwtManager({
	publicKey: process.env.PUBLIC_KEY || 'your-public-key',
	refreshTokenKey: process.env.REFRESH_TOKEN_KEY || 'your-refresh-key',
	signOptions: {
		algorithm: 'RS256',
		expiresIn: '1h',
	},
	verifyOptions: {
		algorithms: ['RS256'],
	},
	middlewareConfigs: {},
});
```

### 2️⃣ **Sign a JWT Token**

```typescript
const token = await sign({
	payload: { id: 1, role: 'user' },
	secret: 'my-secret-key',
});
```

### 3️⃣ **Verify a JWT Token**

```typescript
const decoded = await verify({
	token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
	secret: 'my-public-key',
});
console.log(decoded); // { id: "123", role: "admin", iat: ..., exp: ... }
```

### 4️⃣ **Middleware for JWT Header Authentication**

```typescript
import express from 'express';
import { validateJwtHeaderMiddleware } from 'jwt-smith';

const app = express();
app.use(validateJwtHeaderMiddleware);

app.get('/protected', (req, res) => {
	res.json({ message: 'Access granted!', user: req.user });
});
```

### 5️⃣ **Middleware for JWT Cookie Authentication**

```typescript
import { validateJwtCookieMiddleware } from 'jwt-smith';

app.use(validateJwtCookieMiddleware);

app.get('/secure', (req, res) => {
	res.json({ message: 'Secure route accessed!', user: req.user });
});
```

---

## 🧩 Middleware List

| Middleware                          | Description                                               |
| ----------------------------------- | --------------------------------------------------------- |
| `validateJwtHeaderMiddleware`       | Validates JWT from the Authorization header               |
| `validateJwtCookieMiddleware`       | Validates JWT from cookies and refreshes tokens if needed |
| `roleBasedAuthenticationMiddleware` | Restricts access based on user roles                      |

---

## 🔧 Configuration Options

JWT Smith provides customizable options for security and flexibility.

```typescript
const jwtManager = new JwtManager({
	publicKey: process.env.PUBLIC_KEY || 'your-public-key',
	refreshTokenKey: process.env.REFRESH_TOKEN_KEY || 'your-refresh-key',
	signOptions: {
		algorithm: 'RS256',
		expiresIn: '1h',
	},
	verifyOptions: {
		algorithms: ['RS256'],
	},
	middlewareConfigs: {},
});
```

---

## 💬 Community & Support

💡 **Documentation**: [Read the Docs](https://your-docs-site.com)  
🐛 **Report Issues**: [GitHub Issues](https://github.com/yourusername/jwt-smith/issues)  
🌟 **Feature Requests**: [Discussions](https://github.com/yourusername/jwt-smith/discussions)

---

## 🐜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

### 🎯 Contribute

We welcome contributions! Check out our [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

---

🚀 **Get Started with JWT Smith Today!** 🚀

```sh
npm install jwt-smith
```
