import jsonwebtoken, { JwtHeader } from 'jsonwebtoken';
import Joi from 'joi';

import { log, logFormat } from './logger';
import { Algorithm, PrivateKey, Secret } from './core';

interface SignTokenOptions {
  algorithm?: Algorithm | undefined;
  keyid?: string | undefined;
  expiresIn?: string | number;
  notBefore?: string | number | undefined;
  audience?: string | string[] | undefined;
  subject?: string | undefined;
  issuer?: string | undefined;
  jwtid?: string | undefined;
  mutatePayload?: boolean | undefined;
  noTimestamp?: boolean | undefined;
  header?: JwtHeader | undefined;
  encoding?: string | undefined;
  allowInsecureKeySizes?: boolean | undefined;
  allowInvalidAsymmetricKeyTypes?: boolean | undefined;
}

interface SignTokenParams {
  payload: string | Buffer | object;
  secret: Secret | PrivateKey;
  options?: SignTokenOptions;
}

const signTokenOptionsSchema = Joi.object<SignTokenOptions>({
  algorithm: Joi.string<Algorithm>().default('HS256'),
  keyid: Joi.string(),
  expiresIn: Joi.number(),
  notBefore: Joi.alternatives().try(
    Joi.string(),
    Joi.array(),
  ),
  audience: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ),
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

const secretSchema = Joi.alternatives().try(
  Joi.string(),
  Joi.binary(),
  Joi.object().instance(Buffer),
  Joi.object({
    key: Joi.alternatives().try(Joi.string(), Joi.binary()),
    passphrase: Joi.string(),
  })
).not('');

const signTokenParamsSchema = Joi.object<SignTokenParams>({
  payload: Joi.alternatives()
    .try(Joi.string(), Joi.object(), Joi.binary())
    .required(),
  secret: secretSchema.required(),
  options: signTokenOptionsSchema.optional(),
});

/**
 *
 * @param parameters
 * @returns Promise<string | undefined>
 */
export const sign = (
  parameters: SignTokenParams
): Promise<string | undefined> => {
  return new Promise((resolve, reject) => {
    const { error, warning, value } = signTokenParamsSchema.validate(parameters);
  
    if (error) {
      throw new Error(logFormat(`Parameter Validation Error: ${error.message}`));
    } else if (warning) {
      log('warn', 'Parameter Validation Warning:', { warning_details: warning });
    }
  
    const { payload, secret, options = {} } = value;
    
    jsonwebtoken.sign(payload, secret, options, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
};
