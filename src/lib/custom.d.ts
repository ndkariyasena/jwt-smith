import { Request } from 'express';
import { JsonWebKeyInput, KeyObject, PrivateKeyInput, PublicKeyInput } from 'node:crypto';

export interface Logger {
	info: (message: string, ...args: unknown[]) => void;
	warn: (message: string, ...args: unknown[]) => void;
	error: (message: string, ...args: unknown[]) => void;
	debug: (message: string, ...args: unknown[]) => void;
}

export { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';

export type Secret = string | Buffer | KeyObject | { key: string | Buffer; passphrase: string };

export type Algorithm =
	| 'HS256'
	| 'RS256'
	| 'HS384'
	| 'HS512'
	| 'RS384'
	| 'RS512'
	| 'ES256'
	| 'ES384'
	| 'ES512'
	| 'PS256'
	| 'PS384'
	| 'PS512'
	| 'none';

export type PrivateKey = PrivateKeyInput | string | Buffer | JsonWebKeyInput;

export type PublicKey = PublicKeyInput | string | Buffer | KeyObject | JsonWebKeyInput;

export type Session = string | string[] | Record<string, unknown> | Record<string, unknown>[];

export interface SignTokenOptions {
	algorithm?: Algorithm | undefined;
	keyid?: string | undefined;
	expiresIn?: string | number;
	notBefore?: string | number | undefined;
	audience?: string | string[] | undefined;
	subject?: string | undefined;
	issuer?: string | undefined;
	jwtid?: string | undefined;
	mutatePayload?: boolean | undefined;
	noTimestamp?: boolean | undefined;
	header?: JwtHeader | undefined;
	encoding?: string | undefined;
	allowInsecureKeySizes?: boolean | undefined;
	allowInvalidAsymmetricKeyTypes?: boolean | undefined;
}

export interface VerifyTokenOptions {
	algorithms?: Algorithm[] | undefined;
	audience?: string | RegExp | (string | RegExp)[] | undefined;
	clockTimestamp?: number | undefined;
	clockTolerance?: number | undefined;
	complete?: boolean | undefined;
	issuer?: string | string[] | undefined;
	ignoreExpiration?: boolean | undefined;
	ignoreNotBefore?: boolean | undefined;
	jwtid?: string | undefined;
	nonce?: string | undefined;
	subject?: string | undefined;
	maxAge?: string | number | undefined;
	allowInvalidAsymmetricKeyTypes?: boolean | undefined;
}

export interface TokenStorage {
	getToken?: (userId: string) => Promise<string | string[] | null>;
	saveToken: (userId: string, refreshToken: string, token: string) => Promise<void>;
	saveToken: (userId: string, refreshToken: string) => Promise<void>;
	saveToken: (userId: string, token: string) => Promise<void>;
	deleteToken: (userId: string, token?: string, refreshToken?: string) => Promise<void>;
	getRefreshToken?: (userId: string) => Promise<string | string[] | null>;
}

export interface SessionStorage {
	getSession: (sessionId: string) => Promise<Session | null>;
	saveSession: (sessionId: string, session: Session) => Promise<void>;
	deleteSession: (sessionId: string) => Promise<void>;
}

export interface RefreshTokenHandlerOptions {
	tokenStorage?: TokenStorage;
	sessionStorage?: SessionStorage;
}

export interface CookieNames {
	accessToken?: string | undefined;
	refreshToken?: string | undefined;
}

export type AppendToRequest = 'user' | 'role' | 'language' | 'tokenPayload';

export interface MiddlewareConfigsOptions {
	authHeaderName?: string;
	appendToRequest?: AppendToRequest[] | true;
	cookies?: CookieNames;
	authTokenExtractor?: (header: string) => string;
}

export interface AuthedRequest extends Request {
	user?: unknown;
	role?: unknown;
	language?: unknown;
	tokenPayload?: unknown;
}
