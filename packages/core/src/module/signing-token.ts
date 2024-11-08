import jsonwebtoken from 'jsonwebtoken';
import Joi from 'joi';

import { log, logFormat } from './logger';

interface SignTokenParams {
	payload: object;
	secret: string;
	expiresIn?: string | number;
	algorithm?: 'HS256' | 'RS256';
}

const SignTokenSchema = Joi.object<SignTokenParams>({
	payload: Joi.object().required(),
	secret: Joi.string().min(10).required(),
	expiresIn: Joi.alternatives().try(Joi.string(), Joi.number()),
	algorithm: Joi.string().valid('HS256', 'RS256').default('HS256'),
});

export const sign = (parameters: SignTokenParams): Promise<string | undefined> => {
	const { error, warning, value } = SignTokenSchema.validate(parameters);

	if (error) {
		throw new Error(logFormat(`Parameter Validation Error: ${error.message}`));
	} else if (warning) {
		log('warn', 'Parameter Validation Warning:', { warning_details: warning });
	}
	console.log({ value });

	const { payload, secret } = value;
	const options = {};

	return new Promise((resolve, reject) => {
		jsonwebtoken.sign(payload, secret, options, (err, token) => {
			if (err) {
				reject(err);
			} else {
				resolve(token);
			}
		});
	});
};
