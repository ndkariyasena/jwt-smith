import { NextFunction, Response } from 'express';
import { middlewareConfigs, publicKey } from 'src/lib/core';
import { AppendToRequestProperties, AuthedRequest } from 'src/lib/custom';
import { log } from 'src/lib/logger';
import { verify } from 'src/lib/verify-token';

const validateJwtHeaderMiddleware = async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { appendToRequest = [], authHeaderName, authTokenExtractor } = middlewareConfigs;
		let authHeader = req.headers[authHeaderName ?? ''];

		if (Array.isArray(authHeader)) authHeader = authHeader.join(' ');

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new Error('Valid auth header not found!');
		} else if (authTokenExtractor) {
			const tokenValue = authTokenExtractor(authHeader);

			if (tokenValue) {
				const decodedTokenPayload = await verify({
					token: tokenValue,
					secret: publicKey,
				});

				if (!decodedTokenPayload) {
					throw new Error('Token payload is undefined!');
				}

				if (
					Array.isArray(appendToRequest) &&
					appendToRequest?.length > 0 &&
					decodedTokenPayload &&
					typeof decodedTokenPayload !== 'string'
				) {
					try {
						const castedPayload = decodedTokenPayload as unknown as Record<string, unknown>;

						appendToRequest.forEach((item: AppendToRequestProperties) => {
							if (Object.hasOwn(castedPayload, item)) {
								req[item] = castedPayload[item];
							}
						});
					} catch (error) {
						log('error', 'Token payload appending to the request failed!', error);
					}
				} else if (typeof appendToRequest === 'boolean' && typeof decodedTokenPayload === 'string') {
					req.tokenPayload = decodedTokenPayload;
				}
			} else {
				throw new Error('Auth token not found.');
			}

			next();
		} else {
			throw new Error('Token value extractor method not found.');
		}
	} catch (error) {
		log('error', 'Error occurred while authenticating the JST token.', error);
		res.sendStatus(401);
	}
};

export default validateJwtHeaderMiddleware;
