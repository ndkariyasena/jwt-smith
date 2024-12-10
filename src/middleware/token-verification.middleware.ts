import { NextFunction, Request, Response } from 'express';

import { middlewareConfigs, tokenStorage } from 'src/lib/core';
import { log } from 'src/lib/logger';
import { cookieNames } from 'src/lib/core';
import { appendTokenPayloadToRequest } from 'src/helper/utils';
import { TokenHandler } from 'src/lib/refresh-token-handler';

const authenticateJwtMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { appendToRequest = [], tokenGenerationHandler } = middlewareConfigs;

		const accessToken = cookieNames.accessToken ? req.cookies[cookieNames.accessToken] : undefined;
		const refreshToken = cookieNames.refreshToken ? req.cookies[cookieNames.refreshToken] : undefined;

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

		if (cookieNames.accessToken) {
			res.cookie(cookieNames.accessToken, token, cookieNames.accessTokenOptions || {});
		}

		if (cookieNames.refreshToken && nextRefreshToken) {
			res.cookie(cookieNames.refreshToken, nextRefreshToken, cookieNames.refreshTokenOptions || {});
		}

		next();
	} catch (error) {
		log('error', 'Error occurred while authenticating the JST token.', error);
		res.sendStatus(401);
	}
};

export default authenticateJwtMiddleware;
