import { JsonWebKeyInput, KeyObject, PrivateKeyInput, PublicKeyInput } from 'node:crypto';

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

export interface TokenStorage {
	getToken?: (userId: string) => Promise<string | string[] | null>;
	saveToken?: (userId: string, token?: string, refreshToken?: string) => Promise<void>;
	deleteToken?: (userId: string, token?: string, refreshToken?: string) => Promise<void>;
	getRefreshToken: (userId: string) => Promise<string | string[] | null>;
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
