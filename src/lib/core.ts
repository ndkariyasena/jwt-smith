import Joi from 'joi';
import {
	TokenStorage,
	SessionStorage,
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
	extractApiVersion,
	extractAuthHeaderValue,
	refreshTokenHolderVerifier,
	refreshTokenPayloadVerifier,
} from 'src/helper/utils';

export let tokenStorage: TokenStorage;
export let sessionStorage: SessionStorage;
export let publicKey: Secret | PublicKey;
export let refreshTokenKey: Secret | PublicKey;
export let cookieSettings: CookieSettings = {
	accessTokenCookieName: 'accessToken',
	accessCookieOptions: {},
	refreshTokenCookieName: 'refreshToken',
};
export let middlewareConfigs: MiddlewareConfigsOptions = {
	authHeaderName: 'authorization',
	appendToRequest: [],
	cookies: { accessTokenCookieName: 'accessToken', accessCookieOptions: {}, refreshTokenCookieName: undefined },
	authTokenExtractor: extractAuthHeaderValue,
	tokenGenerationHandler: defaultTokenGenerationHandler,
	refreshTokenPayloadVerifier: refreshTokenPayloadVerifier,
	refreshTokenHolderVerifier: refreshTokenHolderVerifier,
	extractApiVersion: extractApiVersion,
};

interface ConfigOptions {
	tokenStorage?: TokenStorage;
	sessionStorage?: SessionStorage;
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
	sessionStorage: Joi.object<SessionStorage>().optional(),
	logger: Joi.object<Logger>().optional(),
	publicKey: secretSchema.optional(),
	refreshTokenKey: secretSchema.optional(),
	signOptions: Joi.object<SignTokenOptions>().optional(),
	verifyOptions: Joi.object<VerifyTokenOptions>().optional(),
	cookieSettings: Joi.object<CookieSettings>().optional(),
	middlewareConfigs: Joi.object<MiddlewareConfigsOptions>().optional(),
});

export const configure = (options: ConfigOptions) => {
	const { error, warning, value } = configOptionsSchema.validate(options);

	if (error) {
		throw new Error(logFormat(`Parameter Validation Error: ${error.message}`));
	} else if (warning) {
		log('warn', 'Parameter Validation Warning:', { warning_details: warning });
	}

	if (value.logger) setLogger(value.logger);
	if (value.tokenStorage) tokenStorage = value.tokenStorage;
	if (value.sessionStorage) sessionStorage = value.sessionStorage;

	if (value.publicKey) publicKey = value.publicKey;
	if (value.refreshTokenKey) refreshTokenKey = value.refreshTokenKey;

	if (value.signOptions) setDefaultSignOptions(value.signOptions);
	if (value.verifyOptions) setDefaultVerifyOptions(value.verifyOptions);

	if (value.cookieSettings) cookieSettings = { ...cookieSettings, ...value.cookieSettings };
	if (value.middlewareConfigs) middlewareConfigs = { ...middlewareConfigs, ...value.middlewareConfigs };
};
