import { NextFunction, Response } from 'express';

import { middlewareConfigs } from '../lib/core';
import { AuthedRequest } from '../lib/custom';
import { log } from '../lib/logger';
import { TokenHandler } from '../module/refresh-token-handler';
import { appendTokenPayloadToRequest } from '../helper/utils';

/**
 * Middleware to validate JWT from the request header.
 *
 * This middleware extracts the JWT from the specified header, validates it, and optionally refreshes it if needed.
 * It also appends the decoded token payload to the request object for further use in the application.
 *
 * @param req - The authenticated request object.
 * @param res - The response object.
 * @param next - The next middleware function in the stack.
 *
 * @throws Will throw an error if the auth header is not found, the token is invalid, or if the token extraction method is not provided.
 *
 * @returns A promise that resolves to void.
 */
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
			tokenStorage,
		} = middlewareConfigs;
		let authHeader = req.headers[authHeaderName ?? ''];

		log('debug', 'Auth header and middleware configurations extracted.');

		if (Array.isArray(authHeader)) authHeader = authHeader.join('__');

		log('debug', `Auth header: ${authHeader}`);

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new Error('Valid auth header not found');
		}

		if (authTokenExtractor) {
			log('debug', 'Auth token extractor method found.');

			const tokenValue = authTokenExtractor(authHeader);

			log('debug', `Auth token value: ${tokenValue}`);

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

			log('debug', 'Refresh token extracted.');

			const refreshTokenHandler = new TokenHandler({
				refreshTokenStorage: tokenStorage,
				tokenGenerationHandler: tokenGenerationHandler,
				authTokenPayloadVerifier,
				refreshTokenPayloadVerifier,
				refreshTokenHolderVerifier,
			});

			log('debug', 'Token handler created.');
			log('debug', `Auth token: ${tokenValue} | Refresh token: ${refreshToken}`);

			const { decodedToken, nextRefreshToken, token } = await refreshTokenHandler.validateOrRefreshAuthToken(
				tokenValue,
				refreshToken,
			);

			log('debug', 'Token handler validated or refreshed the auth token.');

			if (!decodedToken) {
				throw new Error('Auth cookie payload is undefined!');
			}

			appendTokenPayloadToRequest(req, appendToRequest, decodedToken);

			log('debug', 'Token payload appended to the request object.');

			res.setHeader(authHeaderName ?? 'authorization', token);

			if (cookieSettings.refreshTokenCookieName && nextRefreshToken) {
				log('debug', 'New refresh token set in the cookie.');
				res.cookie(cookieSettings.refreshTokenCookieName, nextRefreshToken, cookieSettings.refreshCookieOptions || {});
			} else if (refreshTokenHeaderName && nextRefreshToken) {
				log('debug', 'New refresh token set in the header.');
				res.setHeader(refreshTokenHeaderName, nextRefreshToken);
			}

			log('debug', 'Next middleware called.');

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
