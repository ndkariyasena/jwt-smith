import jsonwebtoken from 'jsonwebtoken';
import Joi from 'joi';
import { log, logFormat } from './logger';

import { VerifyTokenOptions, PublicKey, Secret, VerifyResponse } from './custom.d';

/**
 * Verify token parameters.
 * The token should be string.
 * The secret can be a string, binary, or object.
 * The options are optional.
 *
 * @interface SignTokenParams
 */
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
	Joi.string().not(''),
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

/**
 * Verifies a JSON Web Token (JWT) using the provided parameters.
 *
 * @param {VerifyTokenParams} parameters - The parameters required to verify the token.
 * @param {string} parameters.token - The JWT to be verified.
 * @param {Secret | PublicKey} parameters.secret - The secret or public key to verify the token.
 * @param {VerifyTokenOptions} [parameters.options] - Optional verification options.
 *
 * @returns {Promise<VerifyResponse>} A promise that resolves with the decoded token if verification is successful, or rejects with an error if verification fails.
 *
 * @throws {Error} If the parameter validation fails.
 *
 * @example
 * ```typescript
 * const decodedToken = await verify({
 *   token: 'awsajhd.suf.aoefyao',
 *   secret: 'your-256-bit-secret',
 *   options: { subject: 'auth-app-user' }
 * });
 * console.log(decodedToken);
 * ```
 */
export const verify = (parameters: VerifyTokenParams): Promise<VerifyResponse> => {
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

/**
 * Sets the default options for verifying tokens.
 *
 * This function validates the provided options against the `verifyTokenOptionsSchema`.
 * If the validation fails, it throws an error with a detailed message.
 * If there are warnings during validation, it logs a warning message.
 * Upon successful validation, it sets the `defaultVerifyOptions` to the validated value.
 *
 * @param {VerifyTokenOptions} options - The options to be validated and set as default.
 * @throws {Error} Throws an error if the validation of the options fails.
 */
export const setDefaultVerifyOptions = (options: VerifyTokenOptions): void => {
	const { error, warning, value } = verifyTokenOptionsSchema.validate(options);

	if (error) {
		throw new Error(logFormat(`Parameter Validation Error: ${error.message}`));
	} else if (warning) {
		log('warn', 'Parameter Validation Warning:', { warning_details: warning });
	}

	defaultVerifyOptions = value;
};
