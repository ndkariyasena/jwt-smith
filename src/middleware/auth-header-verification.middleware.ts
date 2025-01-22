import { NextFunction, Response } from 'express';

import { middlewareConfigs, tokenStorage } from '../lib/core';
import { AuthedRequest } from '../lib/custom';
import { log } from '../lib/logger';
import { TokenHandler } from '../module/refresh-token-handler';
import { appendTokenPayloadToRequest } from '../helper/utils';

const validateJwtHeaderMiddleware = async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		const {
			appendToRequest = [],
			authHeaderName,
			refreshTokenHeaderName,
			authTokenExtractor,
			tokenGenerationHandler,
			cookieSettings = {},
			authTokenPayloadVerifier,
			refreshTokenPayloadVerifier,
			refreshTokenHolderVerifier,
		} = middlewareConfigs;
		let authHeader = req.headers[authHeaderName ?? ''];

		if (Array.isArray(authHeader)) authHeader = authHeader.join('__');

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new Error('Valid auth header not found');
		}

		if (authTokenExtractor) {
			const tokenValue = authTokenExtractor(authHeader);

			if (!tokenValue) {
				throw new Error('Auth token not found');
			}

			let refreshToken =
				req.cookies && cookieSettings.refreshTokenCookieName
					? req.cookies[cookieSettings.refreshTokenCookieName]
					: undefined;

			if (!refreshToken && refreshTokenHeaderName) {
				refreshToken = req.headers[refreshTokenHeaderName];
			}

			const refreshTokenHandler = new TokenHandler({
				refreshTokenStorage: tokenStorage,
				tokenGenerationHandler: tokenGenerationHandler,
				authTokenPayloadVerifier,
				refreshTokenPayloadVerifier,
				refreshTokenHolderVerifier,
			});

			log('debug', `Auth token: ${tokenValue} | Refresh token: ${refreshToken}`);

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
				log('debug', 'New refresh token set in the cookie.');
				res.cookie(cookieSettings.refreshTokenCookieName, nextRefreshToken, cookieSettings.refreshCookieOptions || {});
			} else if (refreshTokenHeaderName && nextRefreshToken) {
				log('debug', 'New refresh token set in the header.');
				res.setHeader(refreshTokenHeaderName, nextRefreshToken);
			}

			return next();
		} else {
			throw new Error('Token value extractor method not found');
		}
	} catch (error) {
		log('error', 'Error occurred while authenticating the JST token.', error);

		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		res.status(401).json({ message: 'Unauthorized', error: errorMessage });
	}
};

export default validateJwtHeaderMiddleware;
