import jsonwebtoken, { JwtHeader } from 'jsonwebtoken';
import Joi from 'joi';

import { log, logFormat } from './logger';
import { Algorithm, PrivateKey, Secret, SignTokenOptions } from './custom.d';

/**
 * Sign token parameters.
 * The payload can be a string, object, or binary.
 * The secret can be a string, binary, or object.
 * The options are optional.
 *
 * @interface SignTokenParams
 */
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
 * Signs a JSON Web Token (JWT) with the given parameters.
 *
 * @param {SignTokenParams} parameters - The parameters for signing the token.
 * @param {string | Buffer | object} parameters.payload - The payload to sign, which can be a string, object, or binary.
 * @param {Secret | PrivateKey} parameters.secret - The secret or private key to sign the token with.
 * @param {SignTokenOptions} [parameters.options] - Optional signing options.
 * @returns {Promise<string | undefined>} A promise that resolves to the signed JWT as a string, or undefined if an error occurs.
 *
 * @throws {Error} If parameter validation fails.
 *
 * @example
 * ```typescript
 * const token = await sign({
 *   payload: { userId: 123 },
 *   secret: 'your-256-bit-secret',
 *   options: { expiresIn: '1h' }
 * });
 * console.log(token);
 * ```
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

/**
 * Sets the default signing options for tokens.
 *
 * This function validates the provided options against the `signTokenOptionsSchema`.
 * If the validation fails, it throws an error with a detailed message.
 * If there are any warnings during validation, it logs a warning message.
 * Upon successful validation, it sets the `defaultSignOptions` to the validated value.
 *
 * @param options - The signing options to be validated and set as default.
 * @throws {Error} If the validation of the options fails.
 */
export const setDefaultSignOptions = (options: SignTokenOptions): void => {
	const { error, warning, value } = signTokenOptionsSchema.validate(options);

	if (error) {
		throw new Error(logFormat(`Parameter Validation Error: ${error.message}`));
	} else if (warning) {
		log('warn', 'Parameter Validation Warning:', { warning_details: warning });
	}

	defaultSignOptions = value;
};
