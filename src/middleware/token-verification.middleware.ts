import { NextFunction, Request, Response } from 'express';

import { middlewareConfigs, tokenStorage } from 'src/lib/core';
import { log } from 'src/lib/logger';
import { cookieSettings } from 'src/lib/core';
import { appendTokenPayloadToRequest } from 'src/helper/utils';
import { TokenHandler } from 'src/lib/refresh-token-handler';

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

		const refreshTokenHandler = new TokenHandler({
			refreshTokenStorage: tokenStorage,
			tokenGenerationHandler: tokenGenerationHandler,
		});

		const { decodedToken, nextRefreshToken, token } = await refreshTokenHandler.validateAuthToken(
			accessToken,
			refreshToken,
		);

		if (!decodedToken) {
			throw new Error('Auth cookie payload is undefined!');
		}

		appendTokenPayloadToRequest(req, appendToRequest, decodedToken);

		if (cookieSettings.accessTokenCookieName) {
			res.cookie(cookieSettings.accessTokenCookieName, token, cookieSettings.accessCookieOptions || {});
		}

		if (cookieSettings.refreshTokenCookieName && nextRefreshToken) {
			res.cookie(cookieSettings.refreshTokenCookieName, nextRefreshToken, cookieSettings.refreshCookieOptions || {});
		}

		next();
	} catch (error) {
		log('error', 'Error occurred while authenticating the JST token.', error);
		res.sendStatus(401);
	}
};

export default authenticateJwtMiddleware;
