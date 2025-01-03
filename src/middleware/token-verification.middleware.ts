import { NextFunction, Request, Response } from 'express';

import { middlewareConfigs, tokenStorage } from '../lib/core';
import { log } from '../lib/logger';
import { cookieSettings } from '../lib/core';
import { appendTokenPayloadToRequest } from '../helper/utils';
import { TokenHandler } from '../module/refresh-token-handler';

const authenticateJwtMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { appendToRequest = [], tokenGenerationHandler } = middlewareConfigs;

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
		res.sendStatus(401);
	}
};

export default authenticateJwtMiddleware;
