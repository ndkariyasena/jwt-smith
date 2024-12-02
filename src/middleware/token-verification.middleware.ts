import { NextFunction, Request, Response } from 'express';
import { publicKey } from 'src/lib/core';

import { log } from 'src/lib/logger';
import { verify } from 'src/lib/verify-token';
import { cookieNames } from '../lib/core';

const authenticateJwtMiddleware = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const authHeader = (req.headers.authorization || req.headers.Authorization) as unknown as string;

		const accessToken = req.cookies[cookieNames.accessToken];
		const refreshToken = req.cookies[cookieNames.refreshToken];

		if ((!authHeader || authHeader.startsWith('Bearer ')) && !accessToken && !refreshToken) {
			return res.sendStatus(401);
		}

		let decodedTokenPayload;
		let tokenValue;

		if (authHeader && authHeader.split(' ')[1]) {
			tokenValue = authHeader.split(' ')[1] as string;
		} else {
			tokenValue = accessToken;
		}

		if (tokenValue) {
			decodedTokenPayload = await verify({
				token: tokenValue,
				secret: publicKey,
			});

			console.log(decodedTokenPayload);
		} else {
			throw new Error('Token not found.');
		}

		return next();
	} catch (error) {
		log('error', 'Error occurred while authenticating the JST token.', error);
		return res.sendStatus(401);
	}
};

export default authenticateJwtMiddleware;
