import { Jwt, JwtPayload } from 'jsonwebtoken';
import { AppendToRequest, AppendToRequestProperties, AuthedRequest } from 'src/lib/custom';
import { log } from 'src/lib/logger';

export const extractAuthHeaderValue = (header: string): string => {
	let tokenValue;

	if (header && header.split(' ')[1]) {
		tokenValue = header.split(' ')[1] as string;
	} else {
		tokenValue = header;
	}

	return tokenValue;
};

export const appendTokenPayloadToRequest = (
	req: AuthedRequest,
	appendToRequest: AppendToRequest,
	decodedTokenPayload: string | Jwt | JwtPayload | undefined,
) => {
	if (
		Array.isArray(appendToRequest) &&
		appendToRequest?.length > 0 &&
		decodedTokenPayload &&
		typeof decodedTokenPayload !== 'string'
	) {
		try {
			const castedPayload = decodedTokenPayload as unknown as Record<string, unknown>;

			appendToRequest.forEach((item: AppendToRequestProperties) => {
				if (Object.hasOwn(castedPayload, item)) {
					req[item] = castedPayload[item];
				}
			});
		} catch (error) {
			log('error', 'Token payload appending to the request failed!', error);
		}
	} else if (typeof appendToRequest === 'boolean' && typeof decodedTokenPayload === 'string') {
		req.tokenPayload = decodedTokenPayload;
	}
};
