# jwt-smith

## 1.0.0

### Major Changes

- a5e7a30: Changelog - Version 1.0.0

  - Initial release of JWT Smith
  - Added JwtManager for centralized configuration management
  - Implemented sign and verify methods for JWT handling
  - Introduced validateJwtCookieMiddleware for token validation via cookies
  - Introduced validateJwtHeaderMiddleware for token validation via headers
  - Implemented roleBasedAuthenticationMiddleware for permission-based access control
  - Added support for custom token storage and middleware configurations
  - Provided a default in-memory token storage solution (not recommended for production)
  - Introduced .auth-permissions.json for defining role-based access controls
  - Included detailed documentation for each middleware and function
