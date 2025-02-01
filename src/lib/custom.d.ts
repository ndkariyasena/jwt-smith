import { Request, CookieOptions } from 'express';
import { JsonWebKeyInput, KeyObject, PrivateKeyInput, PublicKeyInput } from 'node:crypto';
import { Jwt, JwtPayload, JwtHeader } from 'jsonwebtoken';

export interface Logger {
	info: (message: string, ...args: unknown[]) => void;
	warn: (message: string, ...args: unknown[]) => void;
	error: (message: string, ...args: unknown[]) => void;
	debug: (message: string, ...args: unknown[]) => void;
}

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

export type VerifyResponse = string | Jwt | JwtPayload | undefined;

export type AppendToRequestProperties = 'user' | 'role' | 'language' | 'tokenPayload';

export type AppendToRequest = AppendToRequestProperties[] | true;

export interface AuthUser {
	id?: string | number;
	role?: string;
	[key: string]: unknown;
}

export type TokenGenerationHandler = (
	refreshTokenPayload: VerifyResponse,
	tokenHolder: Record<string, unknown>,
) => Promise<{ token: string; refreshToken: string }>;

export type RefreshTokenPayloadVerifier = (refreshTokenPayload: VerifyResponse) => Promise<void>;

export type AuthTokenPayloadVerifier = (tokenPayload: VerifyResponse) => Promise<void>;

export type RefreshTokenHolderVerifier = (
	tokenHolder: Record<string, unknown>,
	refreshTokenPayload: VerifyResponse,
) => Promise<boolean>;

export type ExtractApiVersion = (request: AuthedRequest) => Promise<string | undefined>;

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
	getRefreshToken: (userId: string) => Promise<string | string[] | null>;
	getRefreshTokenHolder: (refreshToken: string) => Promise<Record<string, unknown> | null>;
	saveOrUpdateToken: (userId: string, refreshToken: string, token?: string) => Promise<void>;
	deleteToken: (userId: string, token?: string, refreshToken?: string) => Promise<void>;
	blackListRefreshToken: (token: string, relatedData?: Record<string, unknown>) => Promise<void>;
	checkBlackListedRefreshToken: (token: string) => Promise<Record<string, unknown> | undefined>;
}

export interface CookieSettings {
	accessTokenCookieName?: string;
	accessCookieOptions?: CookieOptions;
	refreshTokenCookieName?: string;
	refreshCookieOptions?: CookieOptions;
}

export interface RequestAppends {
	user?: AuthUser;
	role?: string;
	language?: string | string[];
	tokenPayload?: Record<string, unknown> | unknown | undefined;
}

export type AuthedRequest = RequestAppends & Request;

export interface MiddlewareConfigsOptions {
	/**
	 * Token storage instance.
	 * If not provided, the library will use the default token storage.
	 * The user can provide their own token storage instance.
	 * The library will use the provided token storage instance.
	 * The token storage instance should implement the TokenStorage interface.
	 * The token storage instance should have the following methods:
	 * - getToken
	 * - getRefreshToken
	 * - getRefreshTokenHolder
	 * - saveOrUpdateToken
	 * - deleteToken
	 * - blackListRefreshToken
	 * - checkBlackListedRefreshToken
	 *
	 * @type {TokenStorage}
	 * @memberof ConfigOptions
	 */
	tokenStorage?: TokenStorage;
	authHeaderName?: string;
	refreshTokenHeaderName?: string;
	appendToRequest?: AppendToRequest;
	cookieSettings?: CookieSettings;
	authTokenExtractor?: (header: string) => string | undefined;
	tokenGenerationHandler: TokenGenerationHandler;
	authTokenPayloadVerifier?: AuthTokenPayloadVerifier;
	refreshTokenPayloadVerifier?: RefreshTokenPayloadVerifier;
	refreshTokenHolderVerifier?: RefreshTokenHolderVerifier;
	extractApiVersion?: ExtractApiVersion;
}
