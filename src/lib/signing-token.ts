import jsonwebtoken, { JwtHeader } from 'jsonwebtoken';
import Joi from 'joi';

import { log, logFormat } from './logger';
import { Algorithm, PrivateKey, Secret, SignTokenOptions } from './custom';

interface SignTokenParams {
	payload: string | Buffer | object;
	secret: Secret | PrivateKey;
	options?: SignTokenOptions;
}

const signTokenOptionsSchema = Joi.object<SignTokenOptions>({
	algorithm: Joi.string<Algorithm>().default('HS256'),
	keyid: Joi.string(),
	expiresIn: Joi.alternatives().try(Joi.string(), Joi.number()),
	notBefore: Joi.alternatives().try(Joi.string(), Joi.number()),
	audience: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
	subject: Joi.string(),
	issuer: Joi.string(),
	jwtid: Joi.string(),
	mutatePayload: Joi.bool(),
	noTimestamp: Joi.bool(),
	header: Joi.object<JwtHeader>(),
	encoding: Joi.string(),
	allowInsecureKeySizes: Joi.bool(),
	allowInvalidAsymmetricKeyTypes: Joi.boolean(),
});

const secretSchema = Joi.alternatives()
	.try(
		Joi.string(),
		Joi.binary(),
		Joi.object().instance(Buffer),
		Joi.object({
			key: Joi.alternatives().try(Joi.string(), Joi.binary()),
			passphrase: Joi.string(),
		}),
	)
	.not('');

const signTokenParamsSchema = Joi.object<SignTokenParams>({
	payload: Joi.alternatives().try(Joi.string(), Joi.object(), Joi.binary()).required(),
	secret: secretSchema.required(),
	options: signTokenOptionsSchema.optional(),
});

let defaultSignOptions: SignTokenOptions = {};

/**
 *
 * @param parameters
 * @returns Promise<string | undefined>
 */
export const sign = (parameters: SignTokenParams): Promise<string | undefined> => {
	return new Promise((resolve, reject) => {
		const { error, warning, value } = signTokenParamsSchema.validate(parameters);

		if (error) {
			reject(logFormat(`Parameter Validation Error: ${error.message}`));
		} else if (warning) {
			log('warn', 'Parameter Validation Warning:', { warning_details: warning });
		}

		const { payload, secret, options = {} } = value;
		const signOptions = { ...defaultSignOptions, ...options };

		jsonwebtoken.sign(payload, secret, signOptions, (err, token) => {
			if (err) {
				reject(err);
			} else {
				resolve(token);
			}
		});
	});
};

export const setDefaultSignOptions = (options: SignTokenOptions): void => {
	const { error, warning, value } = signTokenOptionsSchema.validate(options);

	if (error) {
		throw new Error(logFormat(`Parameter Validation Error: ${error.message}`));
	} else if (warning) {
		log('warn', 'Parameter Validation Warning:', { warning_details: warning });
	}

	defaultSignOptions = value;
};
