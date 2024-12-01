import Joi from 'joi';

export const envValidate = (validations?: typeof Joi.object): object => {
	const envSchema = Joi.object({
		APP_PORT: Joi.number().default(3001),

		ACCESS_TOKEN_SECRET: Joi.string().required(),
		REFRESH_TOKEN_SECRET: Joi.string().required(),

		DB_PORT: Joi.number().default(5432),
		DB_HOST: Joi.string().required(),
		DB_USERNAME: Joi.string().required(),
		DB_PASSWORD: Joi.string().required(),
		DB_DATABASE: Joi.string().required(),

		...(validations ?? {}),
	}).unknown();

	const { error, value } = envSchema.validate(process.env);

	if (error) {
		console.error('Invalid environment variables:', error.details);
		process.exit(1);
	}

	return value;
};
