import jsonwebtoken from 'jsonwebtoken';
import Joi from 'joi';
import { log, logFormat } from './logger';

import { Algorithm, PublicKey, Secret } from './core';

interface VerifyTokenOptions {
  algorithms?: Algorithm[] | undefined;
  audience?: string | RegExp | (string | RegExp)[] | undefined;
  clockTimestamp?: number | undefined;
  clockTolerance?: number | undefined;
  complete?: boolean | undefined;
  issuer?: string | string[] | undefined;
  ignoreExpiration?: boolean | undefined;
  ignoreNotBefore?: boolean | undefined;
  jwtid?: string | undefined;
  nonce?: string | undefined;
  subject?: string | undefined;
  maxAge?: string | number | undefined;
  allowInvalidAsymmetricKeyTypes?: boolean | undefined;
}

interface VerifyTokenParams {
  token: string;
  secret: Secret | PublicKey;
  options?: VerifyTokenOptions;
}

const verifyTokenOptionsSchema = Joi.object<VerifyTokenOptions>({
  algorithms: Joi.array().items(Joi.string()),
  audience: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ),
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
  })
);

const verifyTokenParamsSchema = Joi.object<VerifyTokenParams>({
  token: Joi.string().not('').required(),
  secret: secretSchema.required(),
  options: verifyTokenOptionsSchema.optional(),
});

export const verify = (parameters: VerifyTokenParams) => {
  return new Promise((resolve, reject) => {
    const { error, warning, value } =
      verifyTokenParamsSchema.validate(parameters);
  
    if (error) {
      throw new Error(logFormat(`Parameter Validation Error: ${error.message}`));
    } else if (warning) {
      log('warn', 'Parameter Validation Warning:', { warning_details: warning });
    }
  
    const { token, secret, options = {} } = value;

    jsonwebtoken.verify(token, secret, options, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};
