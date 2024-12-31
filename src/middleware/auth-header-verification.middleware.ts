import { NextFunction, Response } from 'express';

import { middlewareConfigs, tokenStorage } from 'src/lib/core';
import { AuthedRequest } from 'src/lib/custom';
import { log } from 'src/lib/logger';
import { cookieSettings } from 'src/lib/core';
import { TokenHandler } from 'src/module/refresh-token-handler';
import { appendTokenPayloadToRequest } from 'src/helper/utils';

const validateJwtHeaderMiddleware = async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { appendToRequest = [], authHeaderName, authTokenExtractor, tokenGenerationHandler } = middlewareConfigs;
		let authHeader = req.headers[authHeaderName ?? ''];

		if (Array.isArray(authHeader)) authHeader = authHeader.join('__');

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new Error('Valid auth header not found!');
		}

		if (authTokenExtractor) {
			const tokenValue = authTokenExtractor(authHeader);

			if (!tokenValue) {
				throw new Error('Auth token not found.');
			}

			const refreshToken =
				req.cookies && cookieSettings.refreshTokenCookieName
					? req.cookies[cookieSettings.refreshTokenCookieName]
					: undefined;

			const refreshTokenHandler = new TokenHandler({
				refreshTokenStorage: tokenStorage,
				tokenGenerationHandler: tokenGenerationHandler,
			});

			const { decodedToken, nextRefreshToken, token } = await refreshTokenHandler.validateOrRefreshAuthToken(
				tokenValue,
				refreshToken,
			);

			if (!decodedToken) {
				throw new Error('Auth cookie payload is undefined!');
			}

			appendTokenPayloadToRequest(req, appendToRequest, decodedToken);

			res.setHeader(authHeaderName ?? 'authorization', token);

			if (cookieSettings.refreshTokenCookieName && nextRefreshToken) {
				res.cookie(cookieSettings.refreshTokenCookieName, nextRefreshToken, cookieSettings.refreshCookieOptions || {});
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
