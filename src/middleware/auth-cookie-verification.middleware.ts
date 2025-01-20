import { NextFunction, Request, Response } from 'express';

import { middlewareConfigs, tokenStorage } from '../lib/core';
import { log } from '../lib/logger';
import { appendTokenPayloadToRequest } from '../helper/utils';
import { TokenHandler } from '../module/refresh-token-handler';

/**
 * Middleware to validate JWT tokens stored in cookies.
 *
 * This middleware checks for the presence of access and refresh tokens in the request cookies.
 * If neither token is found, it throws an error. If tokens are found, it validates or refreshes
 * the tokens using the provided token generation handler and token storage.
 *
 * If the tokens are valid, it appends the decoded token payload to the request object and sets
 * new tokens in the cookies if necessary. If the tokens are invalid or an error occurs during
 * validation, it responds with a 401 Unauthorized status and an error message.
 *
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A promise that resolves to void.
 *
 * @throws Will throw an error if neither access token nor refresh token is found in the cookies.
 * @throws Will throw an error if the decoded token payload is undefined.
 */
const validateJwtCookieMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { appendToRequest = [], tokenGenerationHandler, cookieSettings = {} } = middlewareConfigs;

		const accessToken =
			req.cookies && cookieSettings.accessTokenCookieName
				? req.cookies[cookieSettings.accessTokenCookieName]
				: undefined;

		const refreshToken =
			req.cookies && cookieSettings.refreshTokenCookieName
				? req.cookies[cookieSettings.refreshTokenCookieName]
				: undefined;

		if (!accessToken && !refreshToken) {
			throw new Error('Auth cookie not found!');
		}

		log('debug', `Access token: ${accessToken} | Refresh token: ${refreshToken}`);

		const refreshTokenHandler = new TokenHandler({
			refreshTokenStorage: tokenStorage,
			tokenGenerationHandler: tokenGenerationHandler,
		});

		const { decodedToken, nextRefreshToken, token } = await refreshTokenHandler.validateOrRefreshAuthToken(
			accessToken,
			refreshToken,
		);

		if (!decodedToken) {
			throw new Error('Auth cookie payload is undefined!');
		}

		appendTokenPayloadToRequest(req, appendToRequest, decodedToken);

		if (cookieSettings.accessTokenCookieName) {
			log('debug', 'New access token set in the cookie.');
			res.cookie(cookieSettings.accessTokenCookieName, token, cookieSettings.accessCookieOptions || {});
		}

		if (cookieSettings.refreshTokenCookieName && nextRefreshToken) {
			log('debug', 'New refresh token set in the cookie.');
			res.cookie(cookieSettings.refreshTokenCookieName, nextRefreshToken, cookieSettings.refreshCookieOptions || {});
		}

		next();
	} catch (error) {
		log('error', 'Error occurred while authenticating the JST token.', error);

		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		res.status(401).json({ message: 'Unauthorized', error: errorMessage });
	}
};

export default validateJwtCookieMiddleware;
