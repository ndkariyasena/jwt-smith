import jsonwebtoken, { Jwt, JwtPayload } from 'jsonwebtoken';
import Joi from 'joi';
import { log, logFormat } from './logger';

import { VerifyTokenOptions, PublicKey, Secret } from './custom';

interface VerifyTokenParams {
	token: string;
	secret: Secret | PublicKey;
	options?: VerifyTokenOptions;
}

const verifyTokenOptionsSchema = Joi.object<VerifyTokenOptions>({
	algorithms: Joi.array().items(Joi.string()),
	audience: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
	clockTimestamp: Joi.number(),
	clockTolerance: Joi.number(),
	complete: Joi.bool(),
	issuer: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
	ignoreExpiration: Joi.boolean(),
	ignoreNotBefore: Joi.boolean(),
	jwtid: Joi.string(),
	nonce: Joi.string(),
	subject: Joi.string(),
	maxAge: Joi.alternatives().try(Joi.string(), Joi.number()),
	allowInvalidAsymmetricKeyTypes: Joi.boolean(),
});

const secretSchema = Joi.alternatives().try(
	Joi.string(),
	Joi.binary(),
	Joi.object().instance(Buffer),
	Joi.object({
		key: Joi.alternatives().try(Joi.string(), Joi.binary()),
		passphrase: Joi.string(),
	}),
);

const verifyTokenParamsSchema = Joi.object<VerifyTokenParams>({
	token: Joi.string().not('').required(),
	secret: secretSchema.required(),
	options: verifyTokenOptionsSchema.optional(),
});

let defaultVerifyOptions: VerifyTokenOptions = {};

export const verify = (parameters: VerifyTokenParams): Promise<string | Jwt | JwtPayload | undefined> => {
	return new Promise((resolve, reject) => {
		const { error, warning, value } = verifyTokenParamsSchema.validate(parameters);

		if (error) {
			reject(logFormat(`Parameter Validation Error: ${error.message}`));
		} else if (warning) {
			log('warn', 'Parameter Validation Warning:', { warning_details: warning });
		}

		const { token, secret, options = {} } = value;
		const verifyOptions = { ...defaultVerifyOptions, options };

		jsonwebtoken.verify(token, secret, verifyOptions, (err, decoded) => {
			if (err) {
				reject(err);
			} else {
				resolve(decoded);
			}
		});
	});
};

export const setDefaultVerifyOptions = (options: VerifyTokenOptions): void => {
	const { error, warning, value } = verifyTokenOptionsSchema.validate(options);

	if (error) {
		throw new Error(logFormat(`Parameter Validation Error: ${error.message}`));
	} else if (warning) {
		log('warn', 'Parameter Validation Warning:', { warning_details: warning });
	}

	defaultVerifyOptions = value;
};
