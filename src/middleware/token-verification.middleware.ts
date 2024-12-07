import { NextFunction, Request, Response } from 'express';
import { publicKey } from 'src/lib/core';

import { log } from 'src/lib/logger';
import { verify } from 'src/lib/verify-token';
import { cookieNames } from '../lib/core';

const authenticateJwtMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const accessToken = req.cookies[cookieNames.accessToken];
		const refreshToken = cookieNames.refreshToken ? req.cookies[cookieNames.refreshToken] : undefined;

		if (!accessToken && !refreshToken) {
			throw new Error('Auth cookie not found!');
		}
		await verify({
			token: accessToken,
			secret: publicKey,
		})
			.then((decodedTokenPayload) => {
				console.log(decodedTokenPayload);
			})
			.catch((error) => {
				console.error(error);
			});

		return next();
	} catch (error) {
		log('error', 'Error occurred while authenticating the JST token.', error);
		res.sendStatus(401);
	}
};

export default authenticateJwtMiddleware;
