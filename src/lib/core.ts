import Joi from 'joi';
import {
	TokenStorage,
	Logger,
	PublicKey,
	Secret,
	SignTokenOptions,
	VerifyTokenOptions,
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
 * Middleware configurations.
 * These configurations will be used by the middleware.
 * The user can override these configurations by providing their own configurations.
 * The middleware will use these configurations if not provided by the user.
 *
 * @type MiddlewareConfigsOptions
 */
export let middlewareConfigs: MiddlewareConfigsOptions = {
	authHeaderName: 'authorization',
	appendToRequest: [],
	cookieSettings: { accessTokenCookieName: 'accessToken', accessCookieOptions: {}, refreshTokenCookieName: undefined },
	authTokenExtractor: extractAuthHeaderValue,
	tokenGenerationHandler: defaultTokenGenerationHandler,
	refreshTokenPayloadVerifier: defaultRefreshTokenPayloadVerifier,
	refreshTokenHolderVerifier: defaultRefreshTokenHolderVerifier,
	extractApiVersion: defaultExtractApiVersion,
};
/**
 * Default configurations.
 * These configurations will be used if not provided by the user.
 * The user can override these configurations by providing their own configurations.
 *
 * @interface ConfigOptions
 */
interface ConfigOptions {
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
	/**
	 * Logger instance.
	 * If not provided, the library will use the default logger.
	 * The user can provide their own logger instance.
	 * The library will use the provided logger instance.
	 * The logger instance should implement the Logger interface.
	 * The logger instance should have the following methods:
	 * - info
	 * - warn
	 * - error
	 * - debug
	 *
	 * @type {Logger}
	 * @memberof ConfigOptions
	 */
	logger?: Logger;
	/**
	 * Public key for token verification.
	 * If not provided, the library will use the default public key.
	 * The user can provide their own public key.
	 * The library will use the provided public key.
	 *
	 * @type {Secret | PublicKey}
	 * @memberof ConfigOptions
	 */
	publicKey?: Secret | PublicKey;
	/**
	 * Refresh token key for token verification.
	 * If not provided, the library will use the default refresh token key.
	 * The user can provide their own refresh token key.
	 * The library will use the provided refresh token key.
	 *
	 * @type {Secret | PublicKey}
	 * @memberof ConfigOptions
	 */
	refreshTokenKey?: Secret | PublicKey;
	/**
	 * Default sign options.
	 * If not provided, the library will use the default sign options.
	 * The user can provide their own sign options.
	 * The library will use the provided sign options.
	 *
	 * @type {SignTokenOptions}
	 * @memberof ConfigOptions
	 */
	signOptions?: SignTokenOptions;
	/**
	 * Default verify options.
	 * If not provided, the library will use the default verify options.
	 * The user can provide their own verify options.
	 * The library will use the provided verify options.
	 *
	 * @type {VerifyTokenOptions}
	 * @memberof ConfigOptions
	 */
	verifyOptions?: VerifyTokenOptions;
	/**
	 * Middleware configurations.
	 * These configurations will be used by the middleware.
	 * The user can override these configurations by providing their own configurations.
	 * The middleware will use these configurations if not provided by the user.
	 *
	 * @type {MiddlewareConfigsOptions}
	 * @memberof ConfigOptions
	 */
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
	middlewareConfigs: Joi.object<MiddlewareConfigsOptions>().optional(),
});

/**
 * Configures the library with the provided options.
 * This function should be called before using any other functions.
 * If not called, the library will use the default configurations.
 * If called multiple times, the latest configurations will be used.
 * If the provided options are invalid, an error will be thrown.
 *
 * @param {ConfigOptions} options
 * @throws {Error} Parameter Validation Error
 * @returns {void}
 *
 * @example
 * ```typescript
 * import { configure, JwtManager } from 'jwt-smith';
 *
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
 *  middlewareConfigs: {
 *  authHeaderName: 'authorization',
 *  appendToRequest: ['user'],
 *  cookieSettings: {
 *   accessTokenCookieName: 'access_token',
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
 * });
 */
export const JwtManager = (options: ConfigOptions) => {
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

	if (value.middlewareConfigs) middlewareConfigs = { ...middlewareConfigs, ...value.middlewareConfigs };
};
