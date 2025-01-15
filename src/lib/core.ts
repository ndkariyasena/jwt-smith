import Joi from 'joi';
import {
	TokenStorage,
	Logger,
	PublicKey,
	Secret,
	SignTokenOptions,
	VerifyTokenOptions,
	CookieSettings,
	MiddlewareConfigsOptions,
} from './custom.d';
import { log, logFormat, setLogger } from './logger';
import { setDefaultSignOptions } from './signing-token';
import { setDefaultVerifyOptions } from './verify-token';
import {
	defaultTokenGenerationHandler,
	defaultExtractApiVersion,
	extractAuthHeaderValue,
	defaultRefreshTokenPayloadVerifier,
	defaultRefreshTokenHolderVerifier,
} from '../helper/utils';

/**
 * Token storage instance.
 *
 * @type TokenStorage
 */
export let tokenStorage: TokenStorage;

/**
 * Public key for token verification.
 *
 * @type Secret | PublicKey
 */
export let publicKey: Secret | PublicKey;

/**
 * Refresh token key for token verification.
 *
 * @type Secret | PublicKey
 */
export let refreshTokenKey: Secret | PublicKey;

/**
 * Default sign options.
 *
 * @type CookieSettings
 * @property {string} accessTokenCookieName
 * @property {CookieOptions} accessCookieOptions
 * @property {string} refreshTokenCookieName
 * @property {CookieOptions} refreshCookieOptions
 */
export let cookieSettings: CookieSettings = {
	accessTokenCookieName: undefined,
	accessCookieOptions: {},
	refreshTokenCookieName: undefined,
	refreshCookieOptions: {},
};

/**
 * Middleware configurations.
 * Defines the configurations for the middleware.
 *
 * @type {MiddlewareConfigsOptions}
 * @property {string} authHeaderName
 * @property {AppendToRequest} appendToRequest
 * @property {CookieSettings} cookies
 * @function {AuthTokenExtractor} authTokenExtractor
 * @function {TokenGenerationHandler} tokenGenerationHandler
 * @function {RefreshTokenPayloadVerifier} refreshTokenPayloadVerifier
 * @function {RefreshTokenHolderVerifier} refreshTokenHolderVerifier
 * @function {ExtractApiVersion} extractApiVersion
 */
export let middlewareConfigs: MiddlewareConfigsOptions = {
	authHeaderName: 'authorization',
	appendToRequest: [],
	cookies: { accessTokenCookieName: 'accessToken', accessCookieOptions: {}, refreshTokenCookieName: undefined },
	authTokenExtractor: extractAuthHeaderValue,
	tokenGenerationHandler: defaultTokenGenerationHandler,
	refreshTokenPayloadVerifier: defaultRefreshTokenPayloadVerifier,
	refreshTokenHolderVerifier: defaultRefreshTokenHolderVerifier,
	extractApiVersion: defaultExtractApiVersion,
};

interface ConfigOptions {
	tokenStorage?: TokenStorage;
	logger?: Logger;
	publicKey?: Secret | PublicKey;
	refreshTokenKey?: Secret | PublicKey;
	signOptions?: SignTokenOptions;
	verifyOptions?: VerifyTokenOptions;
	cookieSettings?: CookieSettings;
	middlewareConfigs?: MiddlewareConfigsOptions;
}

const secretSchema = Joi.alternatives().try(
	Joi.string(),
	Joi.binary(),
	Joi.object().instance(Buffer),
	Joi.object({
		key: Joi.alternatives().try(Joi.string(), Joi.binary()),
		passphrase: Joi.string(),
	}),
);

const configOptionsSchema = Joi.object<ConfigOptions>({
	tokenStorage: Joi.object<TokenStorage>().optional(),
	logger: Joi.object<Logger>().optional(),
	publicKey: secretSchema.optional(),
	refreshTokenKey: secretSchema.optional(),
	signOptions: Joi.object<SignTokenOptions>().optional(),
	verifyOptions: Joi.object<VerifyTokenOptions>().optional(),
	cookieSettings: Joi.object<CookieSettings>().optional(),
	middlewareConfigs: Joi.object<MiddlewareConfigsOptions>().optional(),
});

/**
 * Configures the library with the provided options.
 *
 *
 * @param {ConfigOptions} options
 * @throws {Error} Parameter Validation Error
 * @returns {void}
 *
 * @example
 * ```typescript
 * import { configure } from 'jwt-smith';
 * configure({
 *  tokenStorage: new TokenStorage(),
 *  publicKey: 'public key',
 *  refreshTokenKey: 'refresh token key',
 *  signOptions: {
 *   algorithm: 'RS256',
 *   expiresIn: '1h',
 *  },
 *  verifyOptions: {
 *   algorithms: ['RS256'],
 *  },
 *  cookieSettings: {
 *   accessTokenCookieName: 'access_token
 *   accessCookieOptions: {
 *    httpOnly: true,
 *    secure: true,
 *   },
 *   refreshTokenCookieName: 'refresh_token',
 *   refreshCookieOptions: {
 *    httpOnly: true,
 *    secure: true,
 *    },
 *  },
 *  middlewareConfigs: {
 *  authHeaderName: 'authorization',
 *  appendToRequest: ['user'],
 *  cookies: {
 *   accessTokenCookieName: 'access_token
 */
export const configure = (options: ConfigOptions) => {
	const { error, warning, value } = configOptionsSchema.validate(options);

	if (error) {
		throw new Error(logFormat(`Parameter Validation Error: ${error.message}`));
	} else if (warning) {
		log('warn', 'Parameter Validation Warning:', { warning_details: warning });
	}

	if (value.logger) setLogger(value.logger);
	if (value.tokenStorage) tokenStorage = value.tokenStorage;

	if (value.publicKey) publicKey = value.publicKey;
	if (value.refreshTokenKey) refreshTokenKey = value.refreshTokenKey;

	if (value.signOptions) setDefaultSignOptions(value.signOptions);
	if (value.verifyOptions) setDefaultVerifyOptions(value.verifyOptions);

	if (value.cookieSettings) cookieSettings = { ...cookieSettings, ...value.cookieSettings };
	if (value.middlewareConfigs) middlewareConfigs = { ...middlewareConfigs, ...value.middlewareConfigs };
};
