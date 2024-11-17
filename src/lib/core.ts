import Joi from 'joi';
import {
	TokenStorage,
	SessionStorage,
	Logger,
	PublicKey,
	Secret,
	SignTokenOptions,
	VerifyTokenOptions,
} from './custom';
import { log, logFormat, setLogger } from './logger';
import { setDefaultSignOptions } from './signing-token';
import { setDefaultVerifyOptions } from './verify-token';

export let tokenStorage: TokenStorage;
export let sessionStorage: SessionStorage;
export let publicKey: Secret | PublicKey;

interface ConfigOptions {
	tokenStorage?: TokenStorage | undefined;
	sessionStorage?: SessionStorage | undefined;
	logger?: Logger;
	publicKey?: Secret | PublicKey;
	signOptions?: SignTokenOptions | undefined;
	verifyOptions?: VerifyTokenOptions | undefined;
}

const configOptionsSchema = Joi.object<ConfigOptions>({
	tokenStorage: Joi.object<TokenStorage>().optional(),
	sessionStorage: Joi.object<SessionStorage>().optional(),
	logger: Joi.object<Logger>().optional(),
	signOptions: Joi.object<SignTokenOptions>().optional(),
	verifyOptions: Joi.object<VerifyTokenOptions>().optional(),
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

  if (value.signOptions) setDefaultSignOptions(value.signOptions);
  if (value.verifyOptions) setDefaultVerifyOptions(value.verifyOptions);
};
