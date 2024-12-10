import { NextFunction, Response } from 'express';
import { middlewareConfigs, tokenStorage } from 'src/lib/core';
import { AuthedRequest } from 'src/lib/custom';
import { log } from 'src/lib/logger';
import { cookieNames } from 'src/lib/core';
import { TokenHandler } from 'src/lib/refresh-token-handler';
import { appendTokenPayloadToRequest } from 'src/helper/utils';

const validateJwtHeaderMiddleware = async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { appendToRequest = [], authHeaderName, authTokenExtractor, tokenGenerationHandler } = middlewareConfigs;
		let authHeader = req.headers[authHeaderName ?? ''];

		if (Array.isArray(authHeader)) authHeader = authHeader.join(' ');

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new Error('Valid auth header not found!');
		}

		if (authTokenExtractor) {
			const tokenValue = authTokenExtractor(authHeader);

			if (!tokenValue) {
				throw new Error('Auth token not found.');
			}

			const refreshToken = cookieNames.refreshToken ? req.cookies[cookieNames.refreshToken] : undefined;

			const refreshTokenHandler = new TokenHandler({
				refreshTokenStorage: tokenStorage,
				tokenGenerationHandler: tokenGenerationHandler,
			});

			const { decodedToken, nextRefreshToken, token } = await refreshTokenHandler.validateAuthToken(
				tokenValue,
				refreshToken,
			);

			if (!decodedToken) {
				throw new Error('Auth cookie payload is undefined!');
			}

			appendTokenPayloadToRequest(req, appendToRequest, decodedToken);

			res.setHeader(authHeaderName ?? 'authorization', token);

			if (cookieNames.refreshToken && nextRefreshToken) {
				res.cookie(cookieNames.refreshToken, nextRefreshToken, cookieNames.refreshTokenOptions || {});
			}

			/* const decodedTokenPayload = await verify({
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
			} */

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
