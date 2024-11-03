import jsonwebtoken from 'jsonwebtoken';
import Joi from 'joi';

import { log } from "./logger";

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

export const sign = (parameters: SignTokenParams): string => {
  const { error, warning, value } = SignTokenSchema.validate(parameters);
  if (error) {
    throw new Error(`Validation Error: ${error.message}`);
  } else if (warning) {
    log('warn', 'Parameter validation warnings', { warning_details: warning })
  }
  console.log({ value })

  const { payload, secret } = parameters;
  const token = jsonwebtoken.sign(payload, secret, { algorithm: 'RS256' });
  /* TODO: replace with the actual token value. */
  return token || 'token';
};
