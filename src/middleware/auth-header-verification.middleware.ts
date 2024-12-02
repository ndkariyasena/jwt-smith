import { NextFunction, Request, Response } from 'express';
import { extractAuthHeaderValue } from 'src/helper/utils';
import { middlewareConfigs, publicKey } from 'src/lib/core';

import { log } from 'src/lib/logger';
import { verify } from 'src/lib/verify-token';

const validateJwtHeaderMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { appendToRequest, authHeaderName } = middlewareConfigs;
		let authHeader = req.headers[authHeaderName];

		if (Array.isArray(authHeader)) authHeader = authHeader.join(' ');
		console.log({ authHeaderName, authHeader, appendToRequest });

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			console.log('--- Not starts with Bearer');
			res.sendStatus(401);
		} else {
			console.log('verifying');
			let decodedTokenPayload;
			const tokenValue = extractAuthHeaderValue(authHeader);
			console.log({
				authHeader,
				tokenValue,
			});

			if (tokenValue) {
				decodedTokenPayload = await verify({
					token: tokenValue,
					secret: publicKey,
				});

				console.log(decodedTokenPayload);
				if (appendToRequest?.length > 0) {
					console.log(appendToRequest);
				}
			} else {
				throw new Error('Auth token not found.');
			}

			next();
		}
	} catch (error) {
		log('error', 'Error occurred while authenticating the JST token.', error);
		res.sendStatus(401);
	}
};

export default validateJwtHeaderMiddleware;
